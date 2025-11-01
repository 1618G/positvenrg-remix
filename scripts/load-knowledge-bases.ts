import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Map knowledge base files to companion names
const knowledgeBaseMap: Record<string, string> = {
  "grace-knowledge.json": "Grace",
  "ground-edwina-knowledge.json": "Ground Edwina",
  "jim-spiration-knowledge.json": "Jim Spiration",
  "lean-on-mia-knowledge.json": "Lean on Mia",
  "lucyd-knowledge.json": "Lucy'd",
  "mo-tivate-knowledge.json": "Mo Tivate",
  "nojever-knowledge.json": "Nojever",
};

async function loadKnowledgeBases() {
  const knowledgeBaseDir = path.join(process.cwd(), "app/data/knowledge-bases");

  console.log("Loading knowledge bases...\n");

  for (const [filename, companionName] of Object.entries(knowledgeBaseMap)) {
    const filePath = path.join(knowledgeBaseDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }

    const companion = await prisma.companion.findUnique({
      where: { name: companionName },
    });

    if (!companion) {
      console.log(`⚠️  Companion not found: ${companionName}`);
      continue;
    }

    try {
      const knowledgeData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      // Handle different JSON structures
      let entries = [];
      if (Array.isArray(knowledgeData)) {
        entries = knowledgeData;
      } else if (knowledgeData.knowledgeEntries) {
        entries = knowledgeData.knowledgeEntries;
      } else if (knowledgeData.entries) {
        entries = knowledgeData.entries;
      } else if (knowledgeData.data) {
        entries = knowledgeData.data;
      }

      console.log(`📚 Loading ${entries.length} entries for ${companionName}...`);

      // Delete existing knowledge entries for this companion
      await prisma.companionKnowledge.deleteMany({
        where: { companionId: companion.id },
      });

      // Create new knowledge entries
      let loaded = 0;
      for (const entry of entries) {
        try {
          await prisma.companionKnowledge.create({
            data: {
              companionId: companion.id,
              title: entry.title || entry.name || "Untitled",
              content: entry.content || entry.text || entry.description || "",
              category: entry.category || entry.type || "general",
              keywords: entry.keywords || entry.tags || [],
              isActive: true,
            },
          });
          loaded++;
        } catch (error) {
          console.error(`  ❌ Error loading entry: ${error}`);
        }
      }

      console.log(`  ✅ Loaded ${loaded} entries for ${companionName}\n`);
    } catch (error) {
      console.error(`  ❌ Error loading ${filename}: ${error}\n`);
    }
  }

  console.log("Knowledge base loading complete!");
}

loadKnowledgeBases()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

