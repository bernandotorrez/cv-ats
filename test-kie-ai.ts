const apiKey = process.env.KIE_AI_KEY || "9fa167de4c41091850ceb613847e45e1";

async function run() {
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/nano-banana-edit",
      input: {
        prompt: "test",
        image_urls: ["https://picsum.photos/500/500"],
        output_format: "png",
        aspect_ratio: "1:1",
      },
    }),
  });

  const text = await response.text();
  console.log("Response:", response.status, text);
}
run();
