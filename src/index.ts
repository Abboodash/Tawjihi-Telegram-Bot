import dotenv from "dotenv";
import { keepAlive } from "./server";
import { Context, Telegraf } from "telegraf";
import { Update, Message } from "telegraf/typings/core/types/typegram";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN!);
let targetMsg:
  | (Context<{
    message: Update.New & Update.NonChannel & Message.PhotoMessage;
    update_id: number;
  }> &
    Omit<Context<Update>, keyof Context<Update>>)
  | (Context<{
    message: Update.New & Update.NonChannel & Message.DocumentMessage;
    update_id: number;
  }> &
    Omit<Context<Update>, keyof Context<Update>>)
  | undefined;
let botReplyId: number;

const firstString = "هل هذا امتحان مدرسي؟\nوهل تم طمس اسم المعلم والمدرسة؟";
const acceptString = "تم القَبول .. شكرًا لمشاركتنا هذا الامتحان";
const declineString = "تم الحذف .. لمخالفة منشورك قوانين القروب";
const declineMsgsForNoneAdminString = `تم حذف تعليقك ..ممنوع الشات أو طلب امتحان. لطفًا راجع القوانين 👆🏻 ووصف القروب 📝
  
  https://t.me/exams2005/761
  `;

bot.on("photo", async (ctx) => {
  botReplyId = await ctx
    .reply(firstString, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "نعم", callback_data: "yes-btn" },
            { text: "لا", callback_data: "no-btn" },
          ],
        ],
      },
    })
    .then((ctx) => ctx.message_id);
  targetMsg = ctx;
});

bot.on("document", async (ctx) => {
  botReplyId = await ctx
    .reply(firstString, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "نعم", callback_data: "yes-btn" },
            { text: "لا", callback_data: "no-btn" },
          ],
        ],
      },
    })
    .then((ctx) => ctx.message_id);
  targetMsg = ctx;
});

bot.action("yes-btn", async (ctx, next) => {
  if (targetMsg == null) return;
  targetMsg = undefined;
  ctx.deleteMessage(botReplyId);
  let msgId: number = await ctx
    .reply(acceptString)
    .then((ctx) => ctx.message_id);
  setTimeout(() => {
    ctx.deleteMessage(msgId);
  }, 10000);
});

bot.action("no-btn", async (ctx, next) => {
  if (targetMsg == null) return;
  targetMsg?.deleteMessage();
  targetMsg = undefined;
  ctx.deleteMessage(botReplyId);
  let msgId: number = await ctx
    .reply(declineString)
    .then((ctx) => ctx.message_id);
  setTimeout(() => {
    ctx.deleteMessage(msgId);
  }, 10000);
});

bot.on("text", (ctx) => {
  isAdmin(ctx.message.chat.id, ctx.message.from.id, ctx)
    .then(async (result) => {
      if (result) {
        return;
      } else {
        ctx.deleteMessage();
        let msgId = await ctx
          .reply(declineMsgsForNoneAdminString)
          .then((ctx) => ctx.message_id);
        setTimeout(() => {
          ctx.deleteMessage(msgId);
        }, 10000);
      }
    })
    .catch((error) => {
      ctx.reply(
        "An error has ocurred trying to get user rank: " + JSON.stringify(error)
      );
    });
});

bot.on("audio", (ctx) => {
  ctx.deleteMessage(ctx.message.message_id);
  ctx.reply(declineMsgsForNoneAdminString).then((msg) =>
    setTimeout(() => {
      ctx.deleteMessage(msg.message_id);
    }, 10000)
  );
});

bot.on("video", (ctx) => {
  ctx.deleteMessage(ctx.message.message_id);
  ctx.reply(declineMsgsForNoneAdminString).then((msg) =>
    setTimeout(() => {
      ctx.deleteMessage(msg.message_id);
    }, 10000)
  );
});

function isAdmin(
  idOfChat: number,
  IdOfUser: number,
  ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }> &
    Omit<Context<Update>, keyof Context<Update>>
) {
  return new Promise((resolve, reject) => {
    ctx.telegram
      .getChatMember(idOfChat, IdOfUser)
      .then((user) => {
        resolve(user.status == "administrator" || user.status == "creator");
      })
      .catch((error) => {
        reject(error);
      });
  });
}
console.log("The Bot is online.");
keepAlive();
bot.launch();
