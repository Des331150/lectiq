import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  authErrorMessage,
  isAccountExists,
  callbackErrorMessage,
  ACCOUNT_EXISTS_NOTICE,
} from "../../lib/auth-errors.ts";

/**
 * The auth pages used to render `error.message` straight from Supabase. That
 * leaked "User already registered", which tells an anonymous visitor whether an
 * address has an account.
 */
describe("authErrorMessage", () => {
  test("does not disclose that an address is registered", () => {
    const message = authErrorMessage({
      code: "user_already_exists",
      message: "User already registered",
    });
    assert.equal(message, ACCOUNT_EXISTS_NOTICE);
    assert.ok(!/already registered/i.test(message), "must not confirm the account exists");
  });

  test("catches the duplicate case from the message when no code is present", () => {
    const message = authErrorMessage({ message: "User already registered" });
    assert.ok(!/already registered/i.test(message));
  });

  // The lookup keys on the machine code. A failed sign-in reports "Invalid login
  // credentials" as its message and invalid_credentials only as a separate
  // field, so matching on message text alone missed the single most common
  // failure and degraded it to a generic message.
  test("translates invalid credentials by code", () => {
    const message = authErrorMessage({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
    assert.match(message, /don't match an account/);
    assert.ok(!/Invalid login credentials/.test(message), "must not show provider wording");
  });

  test("translates invalid credentials from the message alone", () => {
    const message = authErrorMessage({ message: "Invalid login credentials" });
    assert.match(message, /don't match an account/);
  });

  test("translates a weak password", () => {
    const message = authErrorMessage({
      code: "weak_password",
      message: "Password should be at least 6 characters.",
    });
    assert.match(message, /at least 6 characters/);
    assert.ok(!/^Password should be/.test(message), "must not show provider wording");
  });

  test("strips the SDK's AuthApiError prefix", () => {
    const message = authErrorMessage({
      code: "invalid_credentials",
      message: "AuthApiError: Invalid login credentials",
    });
    assert.match(message, /don't match an account/);
  });

  test("falls back to plain language for an unmapped code", () => {
    const message = authErrorMessage({
      code: "some_new_error_from_the_provider",
      message: "AuthApiError: some new internal wording",
    });
    assert.equal(message, "Something went wrong. Please try again.");
  });

  test("handles a null error", () => {
    assert.equal(authErrorMessage(null), "Something went wrong. Please try again.");
  });
});

describe("isAccountExists", () => {
  test("detects by code", () => {
    assert.equal(isAccountExists({ code: "user_already_exists", message: "" }), true);
  });

  test("detects by message", () => {
    assert.equal(isAccountExists({ message: "User already registered" }), true);
  });

  test("is false for an ordinary credential failure", () => {
    assert.equal(
      isAccountExists({ code: "invalid_credentials", message: "Invalid login credentials" }),
      false
    );
  });

  test("is false for null", () => {
    assert.equal(isAccountExists(null), false);
  });
});

/**
 * Both auth callback routes redirect to ?error=... codes that the login page
 * previously ignored, so an expired or already-used confirmation link landed on
 * a bare form with no explanation.
 */
describe("callbackErrorMessage", () => {
  test("explains an expired callback link", () => {
    const message = callbackErrorMessage("auth_failed");
    assert.ok(message);
    assert.match(message, /no longer valid|expired/i);
  });

  test("explains a failed verification link", () => {
    const message = callbackErrorMessage("verification_failed");
    assert.ok(message);
    assert.match(message, /no longer valid|expired/i);
  });

  test("still returns something for an unknown code", () => {
    const message = callbackErrorMessage("something_new");
    assert.ok(message && message.length > 0);
  });

  test("returns null when there is no code", () => {
    assert.equal(callbackErrorMessage(null), null);
  });
});