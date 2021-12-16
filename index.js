import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import parser from "xml-js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.get("/folders", async (req, res) => {
  // send folder names
  const folders = await fs.readdir("./data");
  res.send(folders);
});

app.post("/read", async (req, res) => {
  // get all images and their annotations
  const folder = req.body.folder;
  const images = await fs.readdir(`./data/${folder}/images`);
  let data = images.map(async (jpg) => {
    const b64 = await fs.readFile(`./data/${folder}/images/${jpg}`, "base64");
    const xml = jpg.replace(".jpg", ".xml");
    const annotation = await fs.readFile(`./data/${folder}/annotations/${xml}`);
    const js = parser.xml2js(annotation, { compact: true });
    return { jpg: jpg, image: b64, annotation: js.annotation };
  });
  data = await Promise.all(data);
  res.send(data);
});

app.post("/write", async (req, res) => {
  // overwrite a single annotation file
  const folder = req.body.folder;
  const jpg = req.body.image;
  const sub = req.body.sub;
  const danger = req.body.danger;
  const xml = jpg.replace(".jpg", ".xml");
  const xmlPath = `./data/${folder}/annotations/${xml}`;
  const xmlContent = await fs.readFile(xmlPath);
  let js = parser.xml2js(xmlContent, { compact: true });
  let objects = js.annotation.object;
  if (!Array.isArray(objects)) objects = [objects];
  objects[sub].danger = { _text: danger };
  const json = JSON.stringify(js);
  let xmlNew = parser.json2xml(json, { compact: true, spaces: 2 });
  await fs.writeFile(xmlPath, xmlNew);
  res.send({});
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Port: ${PORT}`);
  console.log(`Listening...`);
});
