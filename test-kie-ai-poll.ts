const apiKey = process.env.KIE_AI_KEY || "9fa167de4c41091850ceb613847e45e1";

async function run() {
  const taskId = "06e9f460bd2c935ed5732641c9c5d2d6";
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  console.log("Response:", response.status, text);
}
run();
