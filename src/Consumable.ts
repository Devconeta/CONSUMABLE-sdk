class Consumable {
  private readonly privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  public async test(): Promise<any> {
  }
}