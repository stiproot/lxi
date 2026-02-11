import { differenceInDays, format, isToday, isYesterday, parseISO } from 'date-fns';
import { Chat } from '@/types';

interface GroupedChats {
  today: Chat[];
  yesterday: Chat[];
  last30Days: Chat[];
  older: { [month: string]: Chat[] };
}

export const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const groupedChats: GroupedChats = {
    today: [],
    yesterday: [],
    last30Days: [],
    older: {},
  };

  const now = new Date();

  chats.forEach((chat) => {
    const chatDate = parseISO(chat.lastModified);

    if (isToday(chatDate)) {
      groupedChats.today.push(chat);
    } else if (isYesterday(chatDate)) {
      groupedChats.yesterday.push(chat);
    } else if (differenceInDays(now, chatDate) <= 30) {
      groupedChats.last30Days.push(chat);
    } else {
      const monthYear = format(chatDate, 'MMMM yyyy');
      if (!groupedChats.older[monthYear]) {
        groupedChats.older[monthYear] = [];
      }
      groupedChats.older[monthYear].push(chat);
    }
  });

  return groupedChats;
};
