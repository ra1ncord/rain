import { StorageValue } from 'zustand/middleware';
import { fileExists, readFile, writeFile } from "@api/native/fs";

export const createFileStorage = (filePath: string) => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const exists = await fileExists(filePath);
        if (!exists) return null;
        return await readFile(filePath);
      } catch (e) {
        console.error(`Failed to read storage from '${filePath}'`, e);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {  // Added name parameter
      try {
        await writeFile(filePath, value);
      } catch (e) {
        console.error(`Failed to write storage to '${filePath}'`, e);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      // we dont need this
    },
  };
};

export const createFlattenedFileStorage = <T>(filePath: string) => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const exists = await fileExists(filePath);
        if (!exists) return null;
        const content = await readFile(filePath);
        const data = JSON.parse(content);
        
        if (data.state) return content;

        const wrapped: StorageValue<T> = {
          state: data,
          version: 0,
        };
        return JSON.stringify(wrapped);
      } catch (e) {
        return null;
      }
    },
    setItem: async (value: string): Promise<void> => {
      try {
        const parsed = JSON.parse(value) as StorageValue<T>;
        const rawState = JSON.stringify(parsed.state);
        await writeFile(filePath, rawState);
      } catch (e) {
        console.error(`Failed to write to ${filePath}`, e);
      }
    },
    removeItem: async () => {},
  };
};

