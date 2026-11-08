export type Credit = { source: string; author: string; license: string };
export type Gift = {
  id: string;
  list_id: string;
  title: string;
  image_url: string;
  image_credit: Credit | null;
};
export type GiftList = {
  id: string;
  title: string;
  photo_url: string | null;
  gift_count?: number;
};
export type ImageChoice = { url: string; credit: Credit | null };
