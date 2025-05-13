// src/__tests__/controllerResultFactory.test.ts
import { test, describe, expect } from "bun:test";
import ControllerResultFactory from "../factories/controllerResultFactory";

describe("ControllerResultFactory", () => {
  test("success(): defaults to status 200 and data undefined", () => {
    const res = ControllerResultFactory.success();
    expect(res).toEqual({ success: true, data: undefined, status: 200 });
  });

  test("success(data, status): returns given data and status", () => {
    const payload = { foo: "bar" };
    const res = ControllerResultFactory.success(payload, 201);
    expect(res).toEqual({ success: true, data: payload, status: 201 });
  });

  test("error(message): defaults to status 500", () => {
    const res = ControllerResultFactory.error("Something went wrong");
    expect(res).toEqual({ success: false, error: "Something went wrong", status: 500 });
  });

  test("error(message, status): uses custom status", () => {
    const res = ControllerResultFactory.error("Bad request", 400);
    expect(res).toEqual({ success: false, error: "Bad request", status: 400 });
  });

  test("notFound(): defaults to 404 and default message", () => {
    const res = ControllerResultFactory.notFound();
    expect(res).toEqual({ success: false, error: "Resource not found", status: 404 });
  });

  test("notFound(message): uses custom message", () => {
    const res = ControllerResultFactory.notFound("No user");
    expect(res).toEqual({ success: false, error: "No user", status: 404 });
  });

  test("fromError(): handles ValidationError", () => {
    const fakeError = {
      name: "ValidationError",
      errors: { email: "invalid" },
    };
    const res = ControllerResultFactory.fromError(fakeError);
    expect(res).toEqual({
      success: false,
      error: "Validation failed",
      data: { email: "invalid" },
      status: 400,
    });
  });

  test("fromError(): uses error.message and error.statusCode", () => {
    const fakeError = {
      name: "OtherError",
      message: "Oops!",
      statusCode: 418,
    };
    const res = ControllerResultFactory.fromError(fakeError);
    expect(res).toEqual({
      success: false,
      error: "Oops!",
      status: 418,
    });
  });

  test("fromError(): defaults status to 500 when no statusCode", () => {
    const fakeError = {
      name: "OtherError",
      message: "Boom!",
    };
    const res = ControllerResultFactory.fromError(fakeError);
    expect(res).toEqual({
      success: false,
      error: "Boom!",
      status: 500,
    });
  });
});
