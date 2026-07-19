declare module "color-thief-ts" {
  export default class ColorThief {
    getColor(
      image: HTMLImageElement,
      quality?: number
    ): Promise<[number, number, number]>;

    getPalette(
      image: HTMLImageElement,
      colorCount?: number,
      quality?: number
    ): Promise<[number, number, number][]>;
  }
}