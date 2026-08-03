export const ORDER_OBSERVATION_PREFIX = "__OBS_NOTE_V1__";

type EncodedObservation = {
  text: string;
  editedAt: string;
};

const isEncodedObservation = (value: string): boolean => {
  return value.startsWith(ORDER_OBSERVATION_PREFIX);
};

const parseEncodedObservation = (
  value: string,
): EncodedObservation | null => {
  if (!isEncodedObservation(value)) {
    return null;
  }

  const rawPayload = value.slice(ORDER_OBSERVATION_PREFIX.length);

  try {
    const payload = JSON.parse(rawPayload) as Partial<EncodedObservation>;
    if (
      typeof payload.text !== "string" ||
      typeof payload.editedAt !== "string"
    ) {
      return null;
    }

    return {
      text: payload.text,
      editedAt: payload.editedAt,
    };
  } catch {
    return null;
  }
};

export const decodeOrderObservation = (value?: string | null) => {
  const raw = value?.trim();
  if (!raw) {
    return { text: "", editedAt: null as string | null, isEncoded: false };
  }

  const encoded = parseEncodedObservation(raw);
  if (encoded) {
    return {
      text: encoded.text.trim(),
      editedAt: encoded.editedAt,
      isEncoded: true,
    };
  }

  return { text: raw, editedAt: null as string | null, isEncoded: false };
};

export const encodeOrderObservation = (text: string, editedAtIso: string): string => {
  const payload: EncodedObservation = {
    text: text.trim(),
    editedAt: editedAtIso,
  };

  return `${ORDER_OBSERVATION_PREFIX}${JSON.stringify(payload)}`;
};
