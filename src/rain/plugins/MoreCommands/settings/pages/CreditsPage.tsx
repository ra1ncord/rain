import { ReactNative as RN } from "@metro/common";
import { ScrollView } from "react-native";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import Text from "../components/Text";

type Credit = {
  command: string;
  author: string;
  avatar: string;
  github: string;
};

export default function CreditsPage() {
  const credits: Credit[] = [
    {
      command: "Facts Commands",
      author: "jdev082",
      avatar: "https://github.com/jdev082.png",
      github: "https://github.com/jdev082",
    },
    {
      command: "List Commands",
      author: "Kitomanari",
      avatar: "https://github.com/Kitosight.png",
      github: "https://github.com/Kitosight",
    },
    {
      command: "PetPet",
      author: "wolfieeee",
      avatar: "https://github.com/WolfPlugs.png",
      github: "https://github.com/WolfPlugs",
    },
    {
      command: "KonoChan Commands",
      author: "btmc727 & Rico040",
      avatar: "https://github.com/OTKUSteyler.png",
      github: "https://github.com/OTKUSteyler",
    },
    {
      command: "FirstMessage Command",
      author: "sapphire",
      avatar: "https://github.com/aeongdesu.png",
      github: "https://github.com/aeongdesu",
    },
    {
      command: "Sysinfo Command",
      author: "mugman",
      avatar: "https://github.com/mugman174.png",
      github: "https://github.com/mugman174",
    },
    {
      command: "Spotify Commands",
      author: "Kitomanari",
      avatar: "https://github.com/Kitosight.png",
      github: "https://github.com/Kitosight",
    },
    {
      command: "Gary Command",
      author: "Zach Orange",
      avatar: "https://github.com/IAmGaryTheCat.png",
      github: "https://github.com/IAmGaryTheCat",
    },
    {
      command: "IP & NekosLife Commands",
      author: "scruzism",
      avatar: "https://github.com/scrazzz.png",
      github: "https://github.com/scrazzz",
    },
    {
      command: "FriendInvites",
      author: "nikosszzz",
      avatar: "https://github.com/nikosszzz.png",
      github: "https://github.com/nikosszzz",
    },
  ];

  const handleProfilePress = (githubUrl: string) => {
    RN.Linking.openURL(githubUrl);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
        <Text variant="text-md/bold" color="TEXT_MUTED" align="center">
          Thanks to these developers for creating such great plugins!{"\n"}
          Tap any developer to visit their GitHub profile.
        </Text>

        <TableRowGroup title="Plugin Authors">
          {credits.map((credit) => (
            <TableRow
              key={credit.github}
              label={credit.command}
              subLabel={`by ${credit.author}`}
              icon={
                <RN.Image
                  source={{ uri: credit.avatar }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    resizeMode: "cover",
                  }}
                />
              }
              onPress={() => handleProfilePress(credit.github)}
              arrow
            />
          ))}
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}
