import i18n from '../../i18n';

export const tk = (key, fr, opts) => i18n.t(`kit.${key}`, { defaultValue: fr, ...opts });
