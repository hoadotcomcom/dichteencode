import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Teencode là gì?',
    a: 'Teencode là tập hợp các từ viết tắt, ký hiệu, tiếng lóng và slang mà giới trẻ — đặc biệt là học sinh và GenZ Việt Nam — sử dụng khi nhắn tin, chat, bình luận trên mạng xã hội. Teencode bao gồm cả viết tắt tiếng Việt (như "ko", "j z", "vc"), tiếng lóng nội bộ ("chằm zn", "ét o ét") lẫn slang tiếng Anh đã Việt hóa ("flex", "slay", "no cap").',
  },
  {
    q: 'Vì sao teen lại dùng teencode?',
    a: 'Có ba lý do chính: (1) Tốc độ — gõ tắt nhanh hơn khi chat; (2) Bản sắc nhóm — teencode giúp các bạn trẻ cảm thấy thuộc về một thế hệ, một cộng đồng riêng; (3) Sáng tạo ngôn ngữ — đây là cách teen "chơi" với tiếng Việt, tương tự thế hệ 8x–9x từng dùng "2" thay "hai" hay viết "iu" thay "yêu".',
  },
  {
    q: 'Teencode có làm hỏng tiếng Việt không?',
    a: 'Không. Các nhà ngôn ngữ học xem teencode là một biến thể ngôn ngữ phi chính thức (informal register), tồn tại song song với tiếng Việt chuẩn. Vấn đề chỉ phát sinh khi teen dùng teencode trong văn bản trang trọng (bài kiểm tra, đơn từ). Phần lớn teen tự biết khi nào nên dùng và không dùng.',
  },
  {
    q: 'Làm sao để ba mẹ hiểu được teencode mà không cần học thuộc?',
    a: 'Ba mẹ không cần học thuộc — vì teencode thay đổi rất nhanh, mỗi 6 tháng lại có từ mới. Cách hiệu quả nhất là: (1) Dùng công cụ dịch teencode online như tool ở đầu trang này; (2) Hỏi thẳng con với thái độ tò mò, không phán xét; (3) Đọc bình luận trên TikTok, Threads để bắt nhịp dần.',
  },
  {
    q: '"J z tr", "ét o ét", "chằm zn" nghĩa là gì?',
    a: '"J z tr" = "gì vậy trời" (biểu cảm ngạc nhiên, bực mình nhẹ). "Ét o ét" = "SOS", lời kêu cứu hài hước. "Chằm zn" = "trầm cảm" nói chệch đi cho bớt nặng nề, thường dùng khi than vãn nhẹ về deadline, điểm số, crush không trả lời tin nhắn.',
  },
  {
    q: 'Slang GenZ tiếng Anh phổ biến (slay, sus, fr fr, no cap) nghĩa là gì?',
    a: '"Slay" = làm xuất sắc, đỉnh của đỉnh. "Sus" = đáng nghi (viết tắt của suspicious). "Fr fr" = "for real for real", thật đó, không đùa. "No cap" = không nói dối, nói thật. "Mid" = tầm tầm, không hay không dở. "Based" = ngầu, có chính kiến riêng. Những từ này đã len lỏi vào teencode Việt qua TikTok và game.',
  },
  {
    q: 'Teencode 2026 có gì khác so với teencode thời 9x – đầu 2010?',
    a: 'Teencode thời 9x chủ yếu là viết tắt và thay chữ ("kon", "iu", "0", "wên", "kute"). Teencode 2026 có ba lớp chồng lên nhau: (1) viết tắt kiểu cũ; (2) slang nội bộ Việt ("u là zời", "trmúa hmề"); (3) slang tiếng Anh nhập từ TikTok ("rizz", "delulu", "skibidi"). Mật độ từ ngoại nhập cao hơn hẳn.',
  },
  {
    q: 'Công cụ dịch teencode này có lưu nội dung tin nhắn của con tôi không?',
    a: 'Không. Công cụ chỉ xử lý đoạn văn bạn dán vào để trả về kết quả dịch, không lưu trữ nội dung cá nhân, không gắn với tài khoản, không huấn luyện AI từ dữ liệu của bạn. Bạn có thể dán tin nhắn của con yên tâm.',
  },
];

const COMMON_TEENCODE = [
  { group: 'Viết tắt tiếng Việt', items: [
    ['ko / k', 'không'],
    ['dc / đc', 'được'],
    ['j / z', 'gì / vậy'],
    ['vc / vl', 'thán từ mạnh — thể hiện cảm xúc cực độ'],
    ['mn', 'mọi người'],
    ['ny', 'người yêu'],
    ['hum', 'hôm'],
    ['bít', 'biết'],
  ]},
  { group: 'Slang Việt phổ biến', items: [
    ['chằm zn', 'trầm cảm (nói chệch, mang tính than vãn nhẹ)'],
    ['ét o ét', 'SOS — kêu cứu hài hước'],
    ['u là zời / u là trời', 'biểu cảm ngạc nhiên'],
    ['j z tr', 'gì vậy trời'],
    ['xu cà na', 'xui xẻo'],
    ['mlem', 'ngon, hấp dẫn (đồ ăn hoặc người)'],
    ['gato', 'ghen ăn tức ở'],
    ['trmúa hmề', 'trúa hề — buồn cười, lố bịch'],
    ['pmpc', 'phân mảnh phổ cập — chuyện vớ vẩn'],
    ['fa', 'forever alone — độc thân'],
  ]},
  { group: 'Slang tiếng Anh GenZ', items: [
    ['slay', 'làm xuất sắc, đỉnh'],
    ['sus', 'đáng nghi'],
    ['no cap / fr fr', 'không nói điêu, thật đấy'],
    ['flex', 'khoe khoang'],
    ['simp', 'đeo bám một người quá mức'],
    ['toxic', 'độc hại (mối quan hệ, hành vi)'],
    ['mid', 'tầm tầm, bình thường'],
    ['based', 'ngầu, có chính kiến'],
    ['rizz', 'sức hút, khả năng tán tỉnh'],
    ['delulu', 'ảo tưởng (delusional)'],
    ['skibidi', 'từ vô nghĩa, dùng để nhấn nhá hài hước'],
  ]},
];

export default function BlogSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="blog"
      aria-labelledby="blog-heading"
      className="relative mt-24 mb-12"
    >
      {/* Section header — outside scroll box */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 sticker-zap tilt-r-3 mb-4">
          <BookOpen className="w-4 h-4" />
          <span>cẩm nang ba mẹ</span>
        </div>
        <h2
          id="blog-heading"
          className="font-display font-bold text-3xl md:text-5xl tracking-tight text-ink-900 mb-3"
        >
          Teencode là gì?<br className="md:hidden" />{' '}
          <span className="relative inline-block">
            <span className="relative z-10">Cẩm nang giải mã</span>
            <span aria-hidden className="absolute -inset-1 bg-lime-200 -z-0 -rotate-1 rounded-lg" />
          </span>{' '}
          ngôn ngữ GenZ
        </h2>
        <p className="max-w-2xl mx-auto text-ink-900/70 text-base md:text-lg">
          Mọi thứ ba mẹ cần biết về teencode, slang GenZ, và cách bắt sóng con tuổi teen — không phán xét, không hù dọa.
        </p>
      </div>

      {/* Scroll container */}
      <article
        className="relative max-w-4xl mx-auto bg-white border-2 border-ink-900 rounded-2xl shadow-brutal-lg overflow-hidden"
        itemScope
        itemType="https://schema.org/Article"
      >
        <meta itemProp="headline" content="Teencode là gì? Cẩm nang ba mẹ giải mã ngôn ngữ GenZ 2026" />
        <meta itemProp="datePublished" content="2026-05-05" />
        <meta itemProp="inLanguage" content="vi" />
        <meta itemProp="author" content="teencode.vn" />

        {/* Scroll indicator banner */}
        <div className="sticky top-0 z-10 bg-cream-100 border-b-2 border-ink-900 px-4 py-2 flex items-center justify-between text-xs font-semibold text-ink-900/70">
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            cuộn để đọc tiếp
          </span>
          <span>~8 phút đọc</span>
        </div>

        <div
          className="max-h-[600px] overflow-y-auto px-6 md:px-10 py-8 prose-content"
          tabIndex={0}
        >
          {/* Intro */}
          <p className="text-base md:text-lg text-ink-900/80 leading-relaxed mb-6">
            Bạn vừa lướt qua tin nhắn của con và thấy: <em className="bg-cream-200 px-1 rounded">"j z tr m, chằm zn vc, ét o ét"</em>. Bạn không biết đó là tiếng Việt, tiếng Anh, hay con đang gặp vấn đề gì. Yên tâm — bạn không một mình. Đây là <strong>teencode</strong>, và bài viết này sẽ giúp bạn hiểu rõ teencode là gì, vì sao con dùng, khi nào nên lo lắng, và cách bắt nhịp với con mà không cần học thuộc cả một cuốn từ điển.
          </p>

          {/* H2: Định nghĩa */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-8 mb-3">
            1. Teencode là gì?
          </h3>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            <strong>Teencode</strong> (còn gọi là teen code, ngôn ngữ teen, ngôn ngữ tuổi teen) là tập hợp các từ viết tắt, ký hiệu, tiếng lóng và slang mà giới trẻ dùng khi giao tiếp trên không gian mạng. Teencode không phải hiện tượng mới — thế hệ 9x đã từng dùng "0" thay "không", "iu" thay "yêu", "kute" thay "cute". Điểm khác biệt là teencode 2026 phong phú hơn hẳn, lai cả tiếng Anh từ TikTok, Twitch, và các meme toàn cầu.
          </p>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Về mặt ngôn ngữ học, teencode là một <em>biến thể phi chính thức</em> (informal register) của tiếng Việt — tồn tại song song với tiếng Việt chuẩn, chứ không thay thế nó. Teen có thể nói "j z tr" với bạn lúc 2 giờ sáng, nhưng vẫn viết "thưa cô" trong bài tập làm văn. Hai hệ ngôn ngữ này phục vụ hai bối cảnh giao tiếp khác nhau.
          </p>

          {/* H2: Bảng tra nhanh */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            2. Bảng tra nhanh: 30+ teencode thông dụng nhất 2026
          </h3>
          <p className="mb-5 text-ink-900/80 leading-relaxed">
            Đây là những từ teencode bạn sẽ gặp đi gặp lại trong tin nhắn của con. Lưu lại để tra nhanh:
          </p>

          {COMMON_TEENCODE.map((section) => (
            <div key={section.group} className="mb-6">
              <h4 className="font-display font-bold text-lg text-hot-500 mb-2">
                {section.group}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-2 border-ink-900/15 rounded-lg overflow-hidden">
                  <thead className="bg-cream-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold border-b-2 border-ink-900/15 w-1/3">Teencode</th>
                      <th className="text-left px-3 py-2 font-semibold border-b-2 border-ink-900/15">Nghĩa tiếng Việt chuẩn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map(([code, meaning], idx) => (
                      <tr key={code} className={idx % 2 ? 'bg-cream-50/50' : 'bg-white'}>
                        <td className="px-3 py-2 font-mono font-semibold text-ink-900 border-b border-ink-900/10">
                          {code}
                        </td>
                        <td className="px-3 py-2 text-ink-900/80 border-b border-ink-900/10">
                          {meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <p className="text-sm text-ink-900/60 italic mb-6">
            Không thấy từ con đang dùng? Dán vào{' '}
            <button
              onClick={scrollToTop}
              className="text-zap-500 underline font-semibold hover:text-zap-600"
            >
              công cụ dịch ở đầu trang
            </button>
            {' '}— tụi mình cập nhật slang mới hằng tuần.
          </p>

          {/* H2: Vì sao */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            3. Vì sao con bạn nói teencode?
          </h3>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Trước khi lo lắng, hãy hiểu động cơ. Có ba lý do tâm lý đứng sau mọi chữ "j z" hay "no cap":
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-zap-50 border-l-4 border-zap-400 px-4 py-3 rounded-r-lg">
              <h4 className="font-bold text-ink-900 mb-1">Tốc độ</h4>
              <p className="text-sm text-ink-900/80">
                Teen chat 100–200 tin/ngày. Gõ "ko" thay "không" tiết kiệm 40% thời gian. Đây là tối ưu hóa, không phải lười.
              </p>
            </div>
            <div className="bg-hot-50 border-l-4 border-hot-400 px-4 py-3 rounded-r-lg">
              <h4 className="font-bold text-ink-900 mb-1">Bản sắc nhóm</h4>
              <p className="text-sm text-ink-900/80">
                Mỗi thế hệ cần một thứ ngôn ngữ "của riêng mình" để phân biệt với người lớn. Đây là cột mốc trưởng thành tự nhiên — bạn cũng từng nói tiếng lóng mà ba mẹ bạn không hiểu.
              </p>
            </div>
            <div className="bg-lime-50 border-l-4 border-lime-400 px-4 py-3 rounded-r-lg">
              <h4 className="font-bold text-ink-900 mb-1">Sáng tạo ngôn ngữ</h4>
              <p className="text-sm text-ink-900/80">
                Teencode là sân chơi để teen thử nghiệm với từ ngữ. "Trmúa hmề", "u là zời", "ét o ét" đều là sản phẩm sáng tạo có cấu trúc, không hề ngẫu nhiên.
              </p>
            </div>
          </div>

          {/* H2: Khi nào lo */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            4. Khi nào ba mẹ nên thực sự lo lắng?
          </h3>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Phần lớn teencode là vô hại. Nhưng có một số <em>tín hiệu đáng chú ý</em> ba mẹ nên biết:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6 text-ink-900/80">
            <li>
              <strong>Slang về self-harm</strong> — "kms" (kill myself), "unalive", "rope" thường được teen dùng đùa nhưng đôi khi là tín hiệu thật. Quan sát ngữ cảnh, không hoảng loạn nhưng đừng bỏ qua.
            </li>
            <li>
              <strong>Slang về chất kích thích</strong> — "khói", "kẹo", "tem", "bay" trong ngữ cảnh cụ thể có thể không phải nghĩa gốc.
            </li>
            <li>
              <strong>Slang bắt nạt</strong> — "L", "ratio", "cope", "skill issue" dùng dồn dập với một bạn duy nhất có thể là dấu hiệu cyberbullying.
            </li>
            <li>
              <strong>Thay đổi đột ngột</strong> — con vốn dùng teencode vui vẻ, bỗng nhiên im lặng hoặc chuyển sang giọng điệu tối tăm, đây là tín hiệu quan trọng hơn từ ngữ cụ thể.
            </li>
          </ul>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            <strong>Quy tắc vàng:</strong> Lo lắng về <em>cảm xúc</em> đằng sau teencode, không phải bản thân teencode. Một câu "chằm zn" trong nhóm bạn cười đùa khác hẳn "chằm zn" lúc 3 giờ sáng kèm dấu chấm.
          </p>

          {/* H2: Bắt sóng */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            5. Cách "bắt sóng" con mà không cần học thuộc teencode
          </h3>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Bạn không cần biến thành GenZ để hiểu con. Đây là 4 chiến lược đã được nhiều phụ huynh áp dụng thành công:
          </p>

          <ol className="list-decimal pl-6 space-y-3 mb-6 text-ink-900/80">
            <li>
              <strong>Dùng công cụ dịch teencode online.</strong> Đừng giả vờ hiểu khi không hiểu — dán đoạn tin nhắn vào tool ở đầu trang, mất 2 giây có ngay nghĩa tiếng Việt chuẩn. Đây là cách nhanh nhất, không tốn năng lượng.
            </li>
            <li>
              <strong>Hỏi thẳng con với thái độ tò mò, không phán xét.</strong>{' '}
              <em>"Ơ 'rizz' là gì vậy con?"</em> — câu này hiệu quả hơn{' '}
              <em>"Sao con lại dùng từ vớ vẩn vậy?"</em> mười lần. Teen rất thích giải thích văn hóa của mình khi không bị chê bai.
            </li>
            <li>
              <strong>Đọc bình luận TikTok / Threads 5 phút mỗi ngày.</strong> Bạn không cần xem video, chỉ cần lướt qua phần comment. Sau 2 tuần, bạn sẽ tự bắt được nhịp slang đang thịnh hành.
            </li>
            <li>
              <strong>Chấp nhận có những từ con không muốn dịch.</strong> Một số teencode là "in-joke" trong nhóm bạn của con, dịch ra cũng không có nghĩa với bạn. Tôn trọng vùng riêng đó.
            </li>
          </ol>

          {/* H2: FAQ */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            6. Câu hỏi thường gặp về teencode
          </h3>
          <div className="space-y-2 mb-6">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border-2 border-ink-900/15 rounded-lg overflow-hidden bg-white"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-cream-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-ink-900 text-sm md:text-base">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0 text-hot-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0 text-ink-900/60" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-sm text-ink-900/80 leading-relaxed border-t border-ink-900/10">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Closing */}
          <h3 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-10 mb-3">
            7. Tóm lại
          </h3>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Teencode không phải kẻ thù của tiếng Việt. Nó là cách con bạn đang lớn lên, kết nối với bạn bè, và xây dựng bản sắc riêng. Việc của ba mẹ không phải cấm hay học thuộc, mà là <strong>giữ kênh giao tiếp luôn mở</strong> — để khi con cần, con biết có người sẵn sàng lắng nghe, không phán xét, và sẵn sàng dùng tool dịch nếu lỡ không hiểu một câu.
          </p>
          <p className="mb-4 text-ink-900/80 leading-relaxed">
            Mỗi lần bạn dán một đoạn slang vào công cụ dịch teencode thay vì gắt với con, bạn đang đầu tư vào mối quan hệ ba mẹ – con cái cho 10 năm tới. Đó là điều không có cuốn từ điển nào dạy được.
          </p>

          {/* Back to top */}
          <div className="mt-10 pt-6 border-t-2 border-ink-900/10 text-center">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-hot-400 hover:bg-hot-500 text-white font-semibold rounded-full border-2 border-ink-900 shadow-brutal-sm hover:shadow-brutal transition-all hover:-translate-y-0.5"
            >
              <ArrowUp className="w-4 h-4" />
              Quay lại công cụ dịch teencode
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
