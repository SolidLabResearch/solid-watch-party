import { literalToEmoji } from './literalToEmoji.js'


export function parseMessage(message)
{
  const messageLength = message.length

  let emoji_start = -1;
  for (let i = 0; i < messageLength; ++i) {
    const c = message[i];
    switch (c) {
      case ':': {
        if (emoji_start == -1) {
          emoji_start = i + 1
        } else {
          const emoji_end = i
          const emoji = literalToEmoji(message.slice(emoji_start, emoji_end))
          if (emoji) {
            message = message.slice(0, emoji_start - 1) + emoji + message.slice(emoji_end + 1);
          }
        }
      } break ;
      case ' ': {
        emoji_start = -1
      } break ;
    }
  }

  return message;
}

