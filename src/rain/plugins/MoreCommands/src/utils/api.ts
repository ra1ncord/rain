// API functions for facts and images

// Facts APIs
export const uselessFact = async () => {
  const response = await fetch(
    "https://uselessfacts.jsph.pl/api/v2/facts/random",
  );
  const resp = await response.json();
  return {
    text: resp["text"],
    source: resp["source"],
    language: resp["language"],
  };
};

export const dogFact = async () => {
  const response = await fetch("https://dogapi.dog/api/v2/facts?limit=1");
  const resp = await response.json();
  return {
    text: resp["data"]["0"]["attributes"]["body"],
  };
};

export const catFact = async () => {
  const response = await fetch("https://catfact.ninja/fact");
  const resp = await response.json();
  return {
    text: resp["fact"],
    length: resp["length"],
  };
};

// Image APIs
export const getPetPetData = async (image: string) => {
  const data = await fetch(
    `https://api.obamabot.me/v2/image/petpet?image=${image.replace("webp", "png")}`,
  );
  const body = await data.json();
  return body;
};

// Gary API function
export const getGaryUrl = async (source = "gary"): Promise<string | null> => {
  try {
    switch (source) {
      case "gary": {
        const response = await fetch("https://api.garythe.cat/gary");
        const json = await response.json();
        return json.url;
      }
      case "goober": {
        const gooberResponse = await fetch("https://api.garythe.cat/goober");
        const gooberJson = await gooberResponse.json();
        return gooberJson.url;
      }
      case "catapi": {
        const catResponse = await fetch(
          "https://api.thecatapi.com/v1/images/search",
        );
        const catJson = await catResponse.json();
        return catJson[0].url;
      }
      case "minker":
        return "https://minky.materii.dev/";
      default:
        throw new Error("Invalid Gary image source value");
    }
  } catch (error) {
    console.error(`[Gary API] Error fetching image from ${source}:`, error);
    return null;
  }
};
