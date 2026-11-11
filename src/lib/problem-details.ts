export const problemTitles = {
  400: "Bad Request",
  404: "Not Found",
  409: "Conflict",
  503: "Service Unavailable",
} as const;
export type ProblemStatus = keyof typeof problemTitles;
export type ProblemDetails = {
  type: "about:blank";
  title: string;
  status: ProblemStatus;
  code: string;
  detail: string;
};

/** Only pass public allowlisted details, never an exception's message or stack. */
export function problemDetails(
  status: ProblemStatus,
  code: string,
  detail: string,
): ProblemDetails {
  return {
    type: "about:blank",
    title: problemTitles[status],
    status,
    code,
    detail,
  };
}
