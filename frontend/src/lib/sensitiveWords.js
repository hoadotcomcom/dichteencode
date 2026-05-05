/**
 * Sensitive content detector for translation output.
 *
 * Triết lý: bắt theo từ gốc (lemma) chứ không bắt theo cụm,
 * dùng word boundary để tránh false positive (vd "lồng" không match "lồn").
 *
 * Phân loại:
 *  - SEXUAL: bộ phận / hành vi tình dục
 *  - PROFANITY: chửi thề, lăng mạ
 *  - SLUR: kỳ thị / phân biệt
 *  - VIOLENCE: tự hại / bạo lực hướng vào bản thân
 *
 * Trả về { sensitive: boolean, categories: string[] }
 */

// Mỗi pattern là 1 regex đã có \b… word boundary cho an toàn.
// Tiếng Việt không tách word bằng \b chuẩn ASCII nên dùng (^|[\s\p{P}]) prefix.
const PATTERNS = {
  SEXUAL: [
    /(^|[\s\p{P}])l[ồô]n([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])c[ặa]c([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])b[uồ]i([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])buồi([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])đ[ịi]t([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])đ[ụu]([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])chịch([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])v[úu]([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])b[ướ]m([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])dái([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])bím([\s\p{P}]|$)/iu,
  ],
  PROFANITY: [
    /(^|[\s\p{P}])v[ãa]i([\s\p{P}]|$)/iu, // vãi (intensifier thô)
    /(^|[\s\p{P}])đ[ụu] m[áa]([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])đ[ụu] mẹ([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])mẹ m[àa]y([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])bố m[àa]y([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])th[ằă]ng (chó|ngu|óc)([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])con (chó|đĩ|điếm)([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])sấp m[ặa]t([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])fuck([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])shit([\s\p{P}]|$)/iu,
  ],
  SLUR: [
    /(^|[\s\p{P}])bê đê([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])pê đê([\s\p{P}]|$)/iu,
  ],
  VIOLENCE: [
    /(^|[\s\p{P}])tự s[ướ]t([\s\p{P}]|$)/iu,
    /(^|[\s\p{P}])tự t[ửu]([\s\p{P}]|$)/iu,
    /kill (myself|yourself)/i,
    /(^|[\s\p{P}])kms([\s\p{P}]|$)/i,
    /(^|[\s\p{P}])unalive([\s\p{P}]|$)/i,
  ],
};

const CATEGORY_LABELS = {
  SEXUAL: 'ngôn ngữ tình dục',
  PROFANITY: 'chửi thề',
  SLUR: 'từ kỳ thị',
  VIOLENCE: 'tự hại / bạo lực',
};

/**
 * Kiểm tra text có chứa nội dung nhạy cảm không.
 * @param {string} text
 * @returns {{ sensitive: boolean, categories: string[], labels: string[] }}
 */
export function detectSensitive(text) {
  if (!text || typeof text !== 'string') {
    return { sensitive: false, categories: [], labels: [] };
  }

  // Pad để match được token đầu/cuối câu
  const padded = ` ${text} `;
  const categories = [];

  for (const [category, patterns] of Object.entries(PATTERNS)) {
    if (patterns.some((re) => re.test(padded))) {
      categories.push(category);
    }
  }

  return {
    sensitive: categories.length > 0,
    categories,
    labels: categories.map((c) => CATEGORY_LABELS[c]).filter(Boolean),
  };
}
