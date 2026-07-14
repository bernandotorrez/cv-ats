import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    const url = new URL(req.url);

    // GET Request: Check task status (no quota check needed - task already created)
    if (req.method === "GET") {
      const taskId = url.searchParams.get("taskId");
      if (!taskId) {
        return new Response(JSON.stringify({ error: "Missing taskId parameter" }), {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const apiKey = Deno.env.get("KIE_AI_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Kie AI API key is not configured" }), {
          status: 500,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const statusRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!statusRes.ok) {
        const errorText = await statusRes.text();
        console.error("Kie AI status check error:", errorText);
        return new Response(JSON.stringify({ error: "Failed to fetch task status from Kie AI" }), {
          status: statusRes.status,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const statusData = await statusRes.json();
      console.log("Kie AI status response:", JSON.stringify(statusData));

      // Kie AI returns state in data.state and result in data.resultJson
      const data = statusData.data || {};
      const status = data.status ?? data.state;
      const result = data.result || data.resultJson;

      const isSuccess =
        status === 1 ||
        status === "success" ||
        status === "completed" ||
        status === "successed" ||
        status === "DONE";
      const isFailed =
        status === 2 ||
        status === 3 ||
        status === "failed" ||
        status === "error" ||
        status === "FAILED";

      if (isSuccess) {
        let imageUrl = null;
        if (result) {
          if (typeof result === "string") {
            try {
              const parsed = JSON.parse(result);
              imageUrl =
                parsed.url ||
                parsed.image_url ||
                parsed.imageUrl ||
                parsed.images?.[0] ||
                parsed.result;
            } catch (e) {
              if (result.startsWith("http")) imageUrl = result;
            }
          } else if (typeof result === "object") {
            imageUrl =
              result.url ||
              result.image_url ||
              result.imageUrl ||
              result.images?.[0] ||
              result.result;
          }
        }

        // Broad fallback search if still not found
        if (!imageUrl) {
          const str = typeof result === "string" ? result : JSON.stringify(result);
          const match = str?.match(/https?:\/\/[^"'\s\\]+/i);
          if (match) {
            imageUrl = match[0].replace(/\\/g, "");
          }
        }

        if (imageUrl) {
          let debugMsg = "";
          try {
            // Download from Kie AI temporary URL
            const imageRes = await fetch(imageUrl, {
              headers: { "User-Agent": "Mozilla/5.0" },
            });

            if (imageRes.ok) {
              const fileBlob = await imageRes.blob();
              const filePath = `${userId}/pro-photo-${taskId}.png`;

              // Upload to Supabase Storage
              const { error: uploadError } = await admin.storage
                .from("cv-photos")
                .upload(filePath, fileBlob, {
                  contentType: "image/png",
                  upsert: true,
                });

              if (!uploadError) {
                // Get Signed URL
                const { data: signedData } = await admin.storage
                  .from("cv-photos")
                  .createSignedUrl(filePath, 31536000); // 1 year

                if (signedData?.signedUrl) {
                  imageUrl = signedData.signedUrl;
                } else {
                  debugMsg = "Failed to create signed URL";
                }
              } else {
                debugMsg = `Upload error: ${uploadError.message}`;
                console.error("Failed to upload pro-photo to storage:", uploadError);
              }
            } else {
              debugMsg = `Download failed: ${imageRes.statusText}`;
            }
          } catch (storageErr: any) {
            debugMsg = `Storage exception: ${storageErr.message}`;
            console.error("Failed to process image storage:", storageErr);
          }

          return new Response(JSON.stringify({ status: "success", imageUrl, debug: debugMsg }), {
            status: 200,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        } else {
          return new Response(
            JSON.stringify({ status: "failed", error: "Image URL not found in result" }),
            {
              status: 200,
              headers: { ...corsHeaders(req), "Content-Type": "application/json" },
            },
          );
        }
      } else if (isFailed) {
        return new Response(
          JSON.stringify({ status: "failed", error: data.failMsg || "AI generation failed" }),
          {
            status: 200,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(JSON.stringify({ status: "generating" }), {
          status: 200,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // POST Request: Create task
    if (req.method === "POST") {
      const body = await req.json();
      const imageUrl = body.imageUrl;

      if (!imageUrl) {
        return new Response(JSON.stringify({ error: "Missing imageUrl" }), {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Check quota - only on POST (task creation)
      const { data: profile } = await admin
        .from("profiles")
        .select("quota_pro_photo, quota_pro_photo_reset_at")
        .eq("id", userId)
        .single();

      const TIER_PHOTO_QUOTA: Record<string, number> = { starter: 2, pro: 5 };

      // Lazy monthly reset: check if user has a tier subscription and month changed
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const lastReset = profile?.quota_pro_photo_reset_at
        ? new Date(profile.quota_pro_photo_reset_at)
        : null;
      const needsReset = !lastReset || lastReset < monthStart;

      if (needsReset) {
        // Check user's active subscription tier
        const { data: sub } = await admin
          .from("user_subscriptions")
          .select("subscription_tiers!inner(slug)")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        const tierSlug = (sub as any)?.subscription_tiers?.slug as string | undefined;
        const tierAllocation = tierSlug ? TIER_PHOTO_QUOTA[tierSlug] : null;

        if (tierAllocation !== null && tierAllocation !== undefined) {
          // Reset quota to tier allocation
          await admin
            .from("profiles")
            .update({
              quota_pro_photo: tierAllocation,
              quota_pro_photo_reset_at: new Date().toISOString(),
            })
            .eq("id", userId);

          // Use the fresh quota
          var effectiveQuota = tierAllocation;
        } else {
          var effectiveQuota = profile?.quota_pro_photo || 0;
        }
      } else {
        var effectiveQuota = profile?.quota_pro_photo || 0;
      }

      if (effectiveQuota <= 0) {
        return new Response(
          JSON.stringify({
            error: "Access Denied: Please buy Photo Pro Quota to use this feature.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          },
        );
      }

      const apiKey = Deno.env.get("KIE_AI_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Kie AI API key is not configured" }), {
          status: 500,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const prompt =
        "Convert this casual photo of a person into a highly professional business portrait headshot. The person should be facing directly forward with a straight, upright posture, looking directly at the camera. The composition should be a chest-up portrait only (cropped from the chest upward), similar to a professional passport or ID photo. The person should be wearing a clean, modern, and perfectly fitted professional dark suit with a collared white shirt and a matching professional tie (or a professional business blazer/blouse for a woman). The background should be a clean, slightly blurred professional studio background with neutral professional office colors (soft gray/blue). Face features, hairstyle, facial proportions, expression, and gender of the person must remain identical to the input photo. Use polished studio lighting, sharp focus, high-end DSLR camera quality, 8K resolution, and a photorealistic corporate portrait style and Remove Background then Change to White Colour";

      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/nano-banana-edit",
          input: {
            prompt: prompt,
            image_urls: [imageUrl],
            output_format: "png",
            aspect_ratio: "1:1",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Kie AI createTask error response:", errorText);
        return new Response(JSON.stringify({ error: "Failed to create task from Kie AI" }), {
          status: response.status,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const resData = await response.json();
      console.log("Kie AI createTask response data:", JSON.stringify(resData));

      if (resData.code !== 200 && resData.code !== 0 && resData.msg) {
        return new Response(JSON.stringify({ error: `Kie AI Error: ${resData.msg}` }), {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const taskId = resData.data?.taskId || resData.taskId;

      if (!taskId) {
        return new Response(
          JSON.stringify({ error: "No taskId returned from Kie AI", details: resData }),
          {
            status: 500,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          },
        );
      }

      // Decrement quota
      const { error: updateError } = await admin
        .from("profiles")
        .update({ quota_pro_photo: effectiveQuota - 1 })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to decrement quota:", updateError);
        // We continue anyway, but log it.
      }

      return new Response(JSON.stringify({ success: true, taskId }), {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Pro-photo edge function error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
