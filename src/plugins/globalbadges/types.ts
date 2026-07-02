export interface BadgeProps {
  id: string;
  source: { uri: string; };
  label: string;
  userId: string;
}

export interface Badge {
  mod: string;
  badge: string;
  tooltip: string;
  key?: string;
}
