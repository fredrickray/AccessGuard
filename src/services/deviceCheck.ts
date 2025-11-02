import os from "os";

const evaluatePosture = (postureReport: any) => {
  let score = 0; // lower is better
  if (!postureReport.antivirusInstalled) score += 0.3;
  if (!postureReport.diskEncrypted) score += 0.4;
  if (postureReport.lastPatchDays > 30) score += 0.25;
  // very old OS
  if (
    (postureReport.os || "").toLowerCase().includes("windows") &&
    parseInt(postureReport.osVersion || "0") < 10
  )
    score += 0.2;
  // clamp
  if (score > 1) score = 1;
  return { score, details: postureReport };
};

export default evaluatePosture;
