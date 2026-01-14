require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

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
    // 1. Fetch Config AND Memory from Supabase
    // We need 'id' to update the row later
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
    // If memory is null, start fresh
    const currentSummary = config.conversation_summary || "No previous conversation.";
    console.log("📖 Reading Context:", currentSummary.substring(0, 50) + "...");

    // 4. Construct the Prompt for JSON Output
    // We force Gemini to reply in JSON so we can separate the Reply from the Summary
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" } 
    });
    
    const prompt = `
    You are an AI assistant.
    
    SYSTEM INSTRUCTIONS:
    ${config.system_prompt}

    PREVIOUS MEMORY (Summary of past chat):
    ${currentSummary}

    NEW USER MESSAGE:
    ${message.content}

    TASK:
    1. Reply to the user naturally.
    2. Create a NEW summary that merges the OLD memory with this NEW interaction.
    
    OUTPUT JSON FORMAT:
    {
      "reply": "Your response to the user",
      "new_summary": "The updated summary of the conversation history"
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 5. Parse JSON
    const data = JSON.parse(text);
    
    // 6. Send Reply to Discord
    await message.reply(data.reply);

    // 7. Save New Memory to Database
    await supabase
      .from('agent_config')
      .update({ conversation_summary: data.new_summary })
      .eq('id', config.id);

    console.log("🧠 Memory updated in DB.");

  } catch (err) {
    console.error('🔥 Error:', err);
    await message.channel.send("I'm having trouble accessing my memory database.");
  }
});

discord.login(process.env.DISCORD_TOKEN);