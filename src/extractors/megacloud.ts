import { client } from "../utils/client";
import { decrypt } from "../utils/decrypt";
import crypto from "crypto";

export class Megacloud {
  private readonly megacloud = {
    script: "https://megacloud.tv/js/player/a/prod/e1-player.min.js?v=",
    host: "https://megacloud.tv",
  };

  private videoUrl: string;
  constructor(videoUrl: string) {
    this.videoUrl = videoUrl;
  }

  /**
   * scrapeMegaCloud
   */
  public async scrapeMegaCloud() {
    try {
      // Get the video ID from the URL
      const videoId = this.videoUrl.split("/").pop()?.split("?")[0];
      
      // Fetch sources data
      const res = await client(
        `${this.megacloud.host}/embed-2/ajax/e-1/getSources?id=${videoId}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            referer: `${this.megacloud.host}/embed-2/e-1/${videoId}&autoPlay=1&oa=0&asi=1`,
          },
        }
      );

      // Initialize sourceData object
      let sourceData: Sourcedata = {
        intro: res.data.intro,
        outro: res.data.outro,
        sources: [],
        tracks: res.data.tracks,
        server: res.data.server,
      };

      // Fetch decryption key from GitHub repository
      const keyResponse = await client(
        "https://raw.githubusercontent.com/itzzzme/megacloud-keys/refs/heads/main/key.txt"
      );
      
      if (!keyResponse || !keyResponse.data) {
        throw new Error("Failed to fetch decryption key");
      }
      
      const key = keyResponse.data.trim();
      
      // Decrypt the sources using the key
      const decryptedValue = decrypt(res.data.sources, key);
      
      // Parse the decrypted JSON
      const files: Array<{ file: string; type: string }> = JSON.parse(decryptedValue);
      
      // Add sources to sourceData
      files.map((s) => {
        sourceData.sources.push({
          url: s.file,
          type: s.type,
          isM3U8: s.file.includes(".m3u8"),
        });
      });
      
      return sourceData;
    } catch (error) {
      console.error("Error in scrapeMegaCloud:", error);
      throw error;
    }
  }
}
