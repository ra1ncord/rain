export interface BadgeProps {
  id: string;
  source: { uri: string };
  label: string;
  userId: string;
}

export interface CustomBadges {
  customBadgesArray?: {
    badges: Array<{
      badge: string;
      name: string;
    }>;
  };
  aliu?: {
    dev?: boolean;
    donor?: boolean;
    contributor?: boolean;
    custom?: {
      url: string;
      text: string;
    };
  };
  bd?: {
    dev?: boolean;
  };
  enmity?: {
    supporter?: {
      data: {
        name: string;
        id: string;
        url: {
          dark: string;
          light: string;
        };
      };
    };
    staff?: {
      data: {
        name: string;
        id: string;
        url: {
          dark: string;
          light: string;
        };
      };
    };
    dev?: {
      data: {
        name: string;
        id: string;
        url: {
          dark: string;
          light: string;
        };
      };
    };
    contributor?: {
      data: {
        name: string;
        id: string;
        url: {
          dark: string;
          light: string;
        };
      };
    };
    [key: string]: any;
  };
  goosemod?: {
    sponsor?: boolean;
    dev?: boolean;
    translator?: boolean;
  };
  replugged?: {
    developer?: boolean;
    staff?: boolean;
    support?: boolean;
    contributor?: boolean;
    translator?: boolean;
    hunter?: boolean;
    early?: boolean;
    booster?: boolean;
    custom?: {
      name: string;
      icon: string;
      color: string;
    };
  } | null;
  vencord?: {
    contributor?: boolean;
    cutie?: Array<{
      tooltip: string;
      image: string;
    }>;
  };
  equicord?: {
    contributor?: boolean;
    cutie?: Array<{
      tooltip: string;
      image: string;
    }>;
  };
  raincord?: Array<{
    label: string;
    url: string;
  }>;
  reviewdb?: Array<{
    name: string;
    icon: string;
    redirectURL: string;
    description: string;
  }>;
}

export interface BadgeComponents {
  name: string;
  image: string;
  size: number;
  margin: number;
  custom?: object;
}

export type BadgeCache = {
  badges: CustomBadges;
  lastFetch: number;
};

export type BadgeGroupItem = { 
  type: string; 
  label: string; 
  uri: string 
};