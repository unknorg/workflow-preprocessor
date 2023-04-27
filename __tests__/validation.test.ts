import {expect, test} from '@jest/globals'
import {validateTemplate} from "../src/validation";
import {loadYAMLResource} from "./test-utils";
import {Template} from "../src/types";


test('accept valid templates', async () => {
  const tested = loadYAMLResource<Template>('valid-template')
  expect(() => validateTemplate(tested)).not.toThrow()
})

test('reject invalid templates', async () => {
  const tested = loadYAMLResource<Template>('invalid-template')
  expect(() => validateTemplate(tested)).toThrow(new Error("Invalid template"))
})

