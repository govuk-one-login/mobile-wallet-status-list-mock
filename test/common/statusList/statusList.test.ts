import {
  getRevokedStatusListByIndex,
  getValidStatusListWithIndex,
} from "../../../src/common/statusList/statusList";

describe("statusList", () => {
  describe("getValidStatusListWithIndex", () => {
    beforeEach(() => {
      jest.spyOn(global.Math, "random").mockReturnValue(0); // always pick first element
    });

    afterEach(() => {
      jest.spyOn(global.Math, "random").mockRestore();
    });

    it("should return the first valid status list and its index when Math.random is mocked to 0", () => {
      const result = getValidStatusListWithIndex();
      expect(result).toEqual({
        index: 0,
        statusList: { bits: 2, lst: "eNpzcAEAAMYAhQ" },
      });
    });
  });

  describe("getRevokedStatusListByIndex", () => {
    it("should return revoked status list for valid index (0)", () => {
      const result = getRevokedStatusListByIndex(0);
      expect(result).toEqual({ bits: 2, lst: "eNpzdAEAAMgAhg" });
    });

    it("should return revoked status list for valid index (5)", () => {
      const result = getRevokedStatusListByIndex(0);
      expect(result).toEqual({ bits: 2, lst: "eNpzdAEAAMgAhg" });
    });

    it("should throw for invalid index", () => {
      expect(() => getRevokedStatusListByIndex(999)).toThrow(
        "No revoked entry found for index 999",
      );
    });
  });
});
