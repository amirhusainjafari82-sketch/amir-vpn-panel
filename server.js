const express=require("express"),fs=require("fs"),path=require("path"),{Telegraf}=require("telegraf");
const app=express(),PORT=process.env.PORT||3000,TOKEN=process.env.BOT_TOKEN,FILE=path.join(__dirname,"data.json");
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
let db={customers:[],adminChatId:null};try{if(fs.existsSync(FILE))db=JSON.parse(fs.readFileSync(FILE))}catch(e){}
const save=()=>fs.writeFileSync(FILE,JSON.stringify(db,null,2));
if(TOKEN){const bot=new Telegraf(TOKEN);
bot.start(ctx=>{if(!db.adminChatId){db.adminChatId=ctx.chat.id;save();return ctx.reply("✅ بات فعال شد و این چت مدیر شد.");}ctx.reply("سلام 👋 برای تمدید، کلمه «تمدید» را بفرست.");});
bot.command("id",ctx=>ctx.reply("Chat ID: "+ctx.chat.id));
bot.command("stats",ctx=>{if(db.adminChatId&&ctx.chat.id!==db.adminChatId)return;let p=db.customers.filter(x=>x.status==="pending").length,paid=db.customers.filter(x=>x.status==="paid"),inc=paid.reduce((s,x)=>s+(+x.amount||0),0);ctx.reply(`📊 آمار\nمشتری: ${db.customers.length}\n🟡 منتظر پرداخت: ${p}\n🟢 پرداخت شده: ${paid.length}\n💰 درآمد: ${inc.toLocaleString("fa-IR")}`)});
bot.command("debtors",ctx=>{if(db.adminChatId&&ctx.chat.id!==db.adminChatId)return;let a=db.customers.filter(x=>x.status==="pending");ctx.reply(a.length?a.map((x,i)=>`${i+1}. ${x.name} — ${(+x.amount||0).toLocaleString("fa-IR")}`).join("\n"):"✅ بدهکاری ندارید.");});
bot.hears(/تمدید/i,async ctx=>{let name=ctx.from.first_name||ctx.from.username||"مشتری";db.customers.unshift({id:Date.now(),name,username:ctx.from.username?"@"+ctx.from.username:"",phone:"",amount:0,status:"pending",createdAt:Date.now(),reminder:30,chatId:ctx.chat.id});save();await ctx.reply("🟡 درخواست تمدید ثبت شد.");if(db.adminChatId)await bot.telegram.sendMessage(db.adminChatId,`🔔 درخواست تمدید جدید\n👤 ${name}`)});
bot.launch().catch(console.error)}
app.get("/api/customers",(q,r)=>r.json(db.customers));
app.listen(PORT,()=>console.log("Running on "+PORT));