import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    // Check quota_pro_photo
    const { data: profile } = await admin
      .from("profiles")
      .select("quota_pro_photo")
      .eq("id", userId)
      .single();

    const currentQuota = profile?.quota_pro_photo || 0;
    const canUse = currentQuota > 0;

    if (!canUse) {
      return new Response(JSON.stringify({ error: "Access Denied: Please buy Photo Pro Quota to use this feature." }), {
        status: 403,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);

    // GET Request: Check task status
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
          "Authorization": `Bearer ${apiKey}`,
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

      const isSuccess = status === 1 || status === "success" || status === "completed" || status === "successed" || status === "DONE";
      const isFailed = status === 2 || status === 3 || status === "failed" || status === "error" || status === "FAILED";

      if (isSuccess) {
        let imageUrl = null;
        if (result) {
          if (typeof result === "string") {
            try {
              const parsed = JSON.parse(result);
              imageUrl = parsed.url || parsed.image_url || parsed.imageUrl || parsed.images?.[0] || parsed.result;
            } catch (e) {
              if (result.startsWith("http")) imageUrl = result;
            }
          } else if (typeof result === "object") {
            imageUrl = result.url || result.image_url || result.imageUrl || result.images?.[0] || result.result;
          }
        }

        // Broad fallback search if still not found
        if (!imageUrl) {
           const str = typeof result === "string" ? result : JSON.stringify(result);
           const match = str?.match(/https?:\/\/[^"'\s\\]+/i);
           if (match) {
             imageUrl = match[0].replace(/\\/g, '');
           }
        }

        if (imageUrl) {
          return new Response(JSON.stringify({ status: "success", imageUrl }), {
            status: 200,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ status: "failed", error: "Image URL not found in result" }), {
            status: 200,
            headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        }
      } else if (isFailed) {
        return new Response(JSON.stringify({ status: "failed", error: data.failMsg || "AI generation failed" }), {
          status: 200,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
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

      const apiKey = Deno.env.get("KIE_AI_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Kie AI API key is not configured" }), {
          status: 500,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const prompt = "foto harus tegap lurus, backgroudn bewarna putih, hanya sampai dada, seperti pas foto";

      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/nano-banana-edit",
          input: {
            prompt: prompt,
            image_urls: [imageUrl],
            output_format: "png",
            aspect_ratio: "1:1"
          }
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
        return new Response(JSON.stringify({ error: "No taskId returned from Kie AI", details: resData }), {
          status: 500,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Decrement quota
      const { error: updateError } = await admin
        .from("profiles")
        .update({ quota_pro_photo: currentQuota - 1 })
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
