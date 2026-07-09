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

      // Kie AI returns code: 200/0 and status field in data object
      // 1 = success, 0 = generating/processing, 2/3 = failed
      const code = statusData.code;
      const data = statusData.data || {};
      const status = data.status; // status integer
      const result = data.result; // result object/string

      if (status === 1) {
        // Find image URL in result safely
        let imageUrl = null;
        if (result) {
          if (typeof result === "string") {
            imageUrl = result;
          } else if (typeof result === "object") {
            imageUrl = result.url || result.image_url || result.imageUrl || result[0] || Object.values(result).find(val => typeof val === "string" && val.startsWith("http"));
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
      } else if (status === 2 || status === 3) {
        return new Response(JSON.stringify({ status: "failed", error: "AI generation failed" }), {
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

      const prompt = "Convert this casual photo of a person into a highly professional business portrait headshot. The person should be wearing a clean, modern, and perfectly fitted professional dark suit with a collared white shirt and a matching professional tie (or a professional business blazer/blouse for a woman). The background should be a clean, slightly blurred professional studio background with neutral professional office colors (soft gray/blue). Face features, hairstyle, and gender of the person must remain identical to the input photo, but with polished, studio lighting, sharp focus, high-end DSLR camera quality, 8k resolution, photorealistic corporate portrait.";

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
      
      const taskId = resData.data?.taskId || resData.taskId;

      if (!taskId) {
        return new Response(JSON.stringify({ error: "No taskId returned from Kie AI" }), {
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
