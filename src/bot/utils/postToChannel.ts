import { MessageAttachment, SayArguments } from '@slack/bolt';
import { channelNameToId } from './channels';
import { token } from '../constants';

export async function postToChannel({
  channel,
  payload,
}: {
  channel: string; // e.g. @username or #channelname
  payload: SayArguments | string;
}) {
  const channelId = await channelNameToId(channel);
  if (!channelId) {
    return;
  }

  const message =
    typeof payload === 'string'
      ? {
          channel: channelId,
          text: payload,
        }
      : {
          channel: channelId,
          text: '',
          ...payload,
        };

  try {
    const url = 'https://slack.com/api/chat.postMessage';
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    });
    const data = await response.json();

    console.log('data from fetch:', data);
  } catch (err) {
    console.log('fetch Error:', err);
  }
}
