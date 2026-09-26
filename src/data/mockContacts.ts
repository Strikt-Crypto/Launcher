import type { Contact } from "../types";

function link(id: string, name: string, handle: string, url: string) {
  return { id, name, handle, url };
}

export const mockContacts: Contact[] = [
  {
    id: "con-mock-1",
    name: "Noah Keller",
    title: "Launch lead",
    phone: "+1 415 555 0148",
    email: "noah.keller@tokendesk.test",
    company: "Launcher",
    note: "Runs the launch checklist and the startup lane.",
    image: "/contacts/01.jpg",
    providerId: "treasury-desk",
    links: [
      link("con-mock-1-x", "X", "@noahkeller", "https://x.com/noahkeller"),
      link("con-mock-1-tg", "Telegram", "@noahkeller", "https://t.me/noahkeller"),
      link("con-mock-1-dc", "Discord", "noahkeller", "https://discord.com/users/noahkeller"),
    ],
  },
  {
    id: "con-mock-2",
    name: "Lina Ortega",
    title: "Press",
    phone: "+31 6 5550 2219",
    email: "lina.ortega@fourbrothers.test",
    company: "Four Brothers",
    note: "Books the press ladder from Bronze through the top tiers.",
    image: "/contacts/02.jpg",
    providerId: "pr-desk",
    links: [
      link("con-mock-2-x", "X", "@linaortega", "https://x.com/linaortega"),
      link("con-mock-2-ig", "Instagram", "@linaortega", "https://instagram.com/linaortega"),
      link("con-mock-2-web", "Website", "fourbrothers.test", "https://fourbrothers.test"),
    ],
  },
  {
    id: "con-mock-3",
    name: "Marcus Hale",
    title: "Wallet ops",
    phone: "+44 7700 900218",
    email: "marcus.hale@tokendesk.test",
    company: "Launcher",
    note: "Holds deployer and execution wallet access.",
    image: "/contacts/03.jpg",
    links: [
      link("con-mock-3-tg", "Telegram", "@marcushale", "https://t.me/marcushale"),
      link("con-mock-3-dc", "Discord", "marcushale", "https://discord.com/users/marcushale"),
    ],
  },
  {
    id: "con-mock-4",
    name: "Sofia Nguyen",
    title: "Trending",
    phone: "+1 646 555 0194",
    email: "sofia.nguyen@fomo.test",
    company: "FOMO",
    note: "FOMO trending, ranks 1 through 10.",
    image: "/contacts/04.jpg",
    providerId: "fomo-desk",
    links: [
      link("con-mock-4-x", "X", "@sofianguyen", "https://x.com/sofianguyen"),
      link("con-mock-4-tg", "Telegram", "@sofianguyen", "https://t.me/sofianguyen"),
      link("con-mock-4-tt", "TikTok", "@sofianguyen", "https://www.tiktok.com/@sofianguyen"),
    ],
  },
  {
    id: "con-mock-5",
    name: "Jonah Briggs",
    title: "Robinhood listings",
    phone: "+1 628 555 0172",
    email: "jonah.briggs@robinhooddesk.test",
    company: "Robinhood",
    note: "Wallet listing and trending slots on Robinhood.",
    image: "/contacts/05.jpg",
    providerId: "robinhood-desk",
    links: [
      link("con-mock-5-x", "X", "@jonahbriggs", "https://x.com/jonahbriggs"),
      link("con-mock-5-yt", "YouTube", "@jonahbriggs", "https://youtube.com/@jonahbriggs"),
      link("con-mock-5-web", "Website", "robinhooddesk.test", "https://robinhooddesk.test"),
    ],
  },
  {
    id: "con-mock-6",
    name: "Amina Diallo",
    title: "Owner liaison",
    phone: "+33 6 12 34 56 78",
    email: "amina.diallo@tokendesk.test",
    company: "Launcher",
    note: "The person the token owner talks to before a phase is posted.",
    image: "/contacts/06.jpg",
    links: [
      link("con-mock-6-tg", "Telegram", "@aminadiallo", "https://t.me/aminadiallo"),
      link("con-mock-6-ig", "Instagram", "@aminadiallo", "https://instagram.com/aminadiallo"),
      link("con-mock-6-x", "X", "@aminadiallo", "https://x.com/aminadiallo"),
    ],
  },
  {
    id: "con-mock-7",
    name: "Artem",
    title: "Launch and callers",
    phone: "+1 310 555 0142",
    email: "artem@tokendesk.test",
    company: "Artem",
    note: "Tier 1 narrative sheet, the caller list, and the weekly market-making rate.",
    image: "/brands/artem.png",
    providerId: "artem",
    links: [
      link("con-mock-7-tg", "Telegram", "@artem", "https://t.me/artem"),
    ],
  },
];

export const mockContactProjects: Record<string, string[]> = {
  "proj-01": ["con-mock-1", "con-mock-6"],
  "proj-04": ["con-mock-2"],
  "proj-05": ["con-mock-5"],
  "proj-08": ["con-mock-4"],
};
