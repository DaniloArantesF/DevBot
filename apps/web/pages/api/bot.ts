import fetchJson from "@lib/fetch";
import { Command, DiscordRoleData } from "shared/types";

export async function fetchCommands() {
  const data = await fetchJson<Command[]>(`http://localhost:8000/bot/commands`, {
    method: 'GET',
  });
  return data;
}

export async function fetchRoles(guildId: string) {
  const data = await fetchJson<DiscordRoleData[]>(`http://localhost:8000/bot/roles?guildId=${guildId}`, {
    method: 'GET',
  });
  console.log(data);
  return data;
}