require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const http = require('http'); // <--- New Import

// 1. Setup Connections
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

discord.once('ready', () => {
  console.log(`✅ Bot is online as ${discord.user.tag}`);
});

discord.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    // 1. Fetch Config
    const { data: config, error } = await supabase
      .from('agent_config')
      .select('id, system_prompt, allowed_channel_ids, conversation_summary')
      .single();

    if (error || !config) {
      console.log("❌ Error fetching config from DB");
      return;
    }

    // 2. Check Channel
    const allowedIds = config.allowed_channel_ids ? config.allowed_channel_ids.split(',') : [];
    const cleanAllowedIds = allowedIds.map(id => id.trim());
    if (!cleanAllowedIds.includes(message.channel.id)) return;

    await message.channel.sendTyping();

    // 3. Prepare Memory
    const currentSummary = config.conversation_summary || "No previous conversation.";
    
    // 4. Ask Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // Using Stable version
      generationConfig: { responseMimeType: "application/json" } 
    });
    
    const prompt = `
    You are an AI assistant.
    SYSTEM INSTRUCTIONS: ${config.system_prompt}
    PREVIOUS MEMORY: ${currentSummary}
    NEW USER MESSAGE: ${message.content}
    TASK: Reply to user and update summary.
    OUTPUT JSON FORMAT: { "reply": "string", "new_summary": "string" }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    
    // 5. Send Reply
    await message.reply(data.reply);

    // 6. Save New Memory
    const updateResult = await supabase
      .from('agent_config')
      .update({ conversation_summary: data.new_summary })
      .eq('id', config.id)

  } catch (err) {
    console.error('🔥 Error:', err);
  }
});

discord.login(process.env.DISCORD_TOKEN);


// This creates a tiny web server that listens on the port Render assigns.
// It stops Render from killing the bot for "Timeout".
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Figmenta Bot is Alive!');
  res.end();
}).listen(port, () => {
  console.log(`🌍 Keep-Alive Server listening on port ${port}`);
});