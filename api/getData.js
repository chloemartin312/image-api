import { readFileSync } from "fs";
import { join } from "path";

export default function handler(req, res) {
  const filePath = join(process.cwd(), "userInfo.json");
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  res.status(200).json(data);
}