import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export class CompressedFBXLoader extends THREE.Loader<THREE.Group> {
  load(
    url: string,
    onLoad: (object: THREE.Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    const resolvedUrl = this.manager.resolveURL(this.path + url);
    this.manager.itemStart(resolvedUrl);

    void this.loadCompressed(resolvedUrl, onProgress)
      .then((buffer) => {
        const loader = new FBXLoader(this.manager);
        onLoad(loader.parse(buffer, this.resourcePath || this.path));
        this.manager.itemEnd(resolvedUrl);
      })
      .catch((error: unknown) => {
        onError?.(error);
        this.manager.itemError(resolvedUrl);
        this.manager.itemEnd(resolvedUrl);
      });
  }

  private async loadCompressed(
    url: string,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Unable to load the compressed FBX (${response.status})`);
    }

    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new Uint8Array(value.byteLength);
      chunk.set(value);
      chunks.push(chunk.buffer);
      loaded += value.byteLength;
      onProgress?.(
        new ProgressEvent("progress", {
          lengthComputable: total > 0,
          loaded,
          total,
        }),
      );
    }

    const compressed = new Blob(chunks);
    const stream = compressed.stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).arrayBuffer();
  }
}
