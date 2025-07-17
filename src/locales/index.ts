export { default as en } from './en.json';
export { default as ar } from './ar.json';

export type TranslationKey = keyof typeof import('./en.json');
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKeyPath = NestedKeyOf<typeof import('./en.json')>;

export const translations = {
  en: require('./en.json'),
  ar: require('./ar.json'),
};

export type Language = keyof typeof translations;
export type Translation = typeof translations['en'];