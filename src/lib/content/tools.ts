import type { ToolId } from '$lib/pdf/types';

export type ToolFaq = { question: string; answer: string };
export type ToolDefinition = {
	id: ToolId;
	slug: string;
	title: string;
	nav: string;
	short: string;
	description: string;
	keywords: string;
	accept: string;
	multiple: boolean;
	kind: 'pdf' | 'image';
	action: string;
	steps: string[];
	paragraphs: string[];
	faqs: ToolFaq[];
};

export const tools: ToolDefinition[] = [
	{
		id: 'merge',
		slug: 'ghep-pdf',
		title: 'Ghép PDF',
		nav: 'Ghép PDF',
		short: 'Nối nhiều PDF thành một tệp, giữ nguyên thứ tự bạn sắp xếp.',
		description:
			'Ghép nhiều file PDF thành một tài liệu ngay trên trình duyệt. Kéo thả để đổi thứ tự, xem trang bìa và tải file đã ghép mà không cần tài khoản.',
		keywords: 'ghép pdf, nối pdf, gộp file pdf online, merge pdf',
		accept: 'application/pdf,.pdf',
		multiple: true,
		kind: 'pdf',
		action: 'Ghép PDF',
		steps: [
			'Chọn hoặc kéo thả từ hai file PDF trở lên.',
			'Sắp xếp thứ tự file bằng cách kéo thả.',
			'Bấm Ghép PDF và tải tài liệu đã nối.'
		],
		paragraphs: [
			'Ghép PDF giúp gom hợp đồng, bài giảng hoặc hồ sơ scan đang nằm ở nhiều file. Sổ đọc từng tài liệu trên máy bạn, sao chép trang theo đúng thứ tự rồi tạo một PDF mới.',
			'Với file vừa và nhỏ, toàn bộ việc ghép diễn ra trong trình duyệt. File rất nặng mới được đề nghị chuyển sang máy chủ qpdf, và chỉ khi bạn đồng ý tải lên. Tệp tạm trên máy chủ bị xóa ngay sau khi xử lý xong.',
			'Thao tác tạo file mới nên chữ ký số trên bản gốc sẽ không còn hiệu lực ở bản đã ghép. Hãy giữ file nguồn nếu bạn cần bản đã ký.'
		],
		faqs: [
			{
				question: 'Ghép PDF có làm giảm chất lượng trang không?',
				answer:
					'Trang được sao chép nguyên nội dung, không qua bước nén lại ảnh. Bản ghép là một PDF mới nên thông tin chữ ký số của từng file gốc không được giữ.'
			},
			{
				question: 'Tôi có thể đổi thứ tự file trước khi ghép không?',
				answer: 'Có. Kéo thả các file trong danh sách hoặc dùng nút đưa lên, đưa xuống.'
			}
		]
	},
	{
		id: 'split',
		slug: 'tach-pdf',
		title: 'Tách PDF',
		nav: 'Tách PDF',
		short: 'Tách từng trang hoặc theo khoảng trang bạn chỉ định.',
		description:
			'Tách PDF theo từng trang hoặc theo khoảng tùy chọn như 1-3, 5, 8-10. Xem trước thumbnail và tải từng phần hoặc một file zip.',
		keywords: 'tách pdf, cắt pdf, tách trang pdf, split pdf',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Tách PDF',
		steps: [
			'Tải một file PDF lên vùng kéo thả.',
			'Chọn tách từng trang hoặc nhập khoảng trang.',
			'Tải các file kết quả hoặc gói zip.'
		],
		paragraphs: [
			'Dùng tách PDF khi cần gửi riêng một phụ lục, một chương hoặc vài trang scan. Bạn có thể tách mỗi trang thành một file, hoặc giữ một khoảng liên tiếp trong cùng một file.',
			'Cú pháp khoảng trang là các số cách nhau bởi dấu phẩy. Ví dụ 1-3, 5, 8-10 tạo ba file: trang 1 đến 3, trang 5, và trang 8 đến 10.',
			'Ảnh thu nhỏ chỉ tải khi trang sắp hiện trên màn hình, nên tài liệu dài không bị render toàn bộ cùng lúc.'
		],
		faqs: [
			{
				question: 'Khoảng trang viết thế nào?',
				answer: 'Viết 1-3, 5, 8-10. Số trang bắt đầu từ 1 và không được lớn hơn số trang của file.'
			},
			{
				question: 'Tôi nhận được nhiều file thì tải ra sao?',
				answer: 'Có thể tải từng file hoặc tải một lần dưới dạng zip.'
			}
		]
	},
	{
		id: 'delete',
		slug: 'xoa-trang-pdf',
		title: 'Xóa trang PDF',
		nav: 'Xóa trang',
		short: 'Chọn trang không cần và lưu phần còn lại.',
		description:
			'Xóa một hoặc nhiều trang khỏi PDF. Chọn trên ảnh thu nhỏ, giữ nguyên thứ tự các trang còn lại và tải file mới.',
		keywords: 'xóa trang pdf, bỏ trang pdf, delete pdf pages',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Xóa trang đã chọn',
		steps: [
			'Mở file PDF cần chỉnh.',
			'Chọn những trang muốn bỏ.',
			'Xác nhận xóa và tải bản còn lại.'
		],
		paragraphs: [
			'Xóa trang hữu ích khi bộ hồ sơ scan lẫn trang trắng, trang trùng hoặc tờ nháp. Sổ bỏ đúng các trang đã chọn và giữ nguyên nội dung các trang còn lại.',
			'Bạn không thể xóa hết mọi trang vì file kết quả phải còn ít nhất một trang. Nếu chỉ cần tách một phần, hãy dùng công cụ Tách PDF.',
			'Bản đã xóa trang là tài liệu đã chỉnh sửa. Chữ ký số trên file gốc sẽ không còn giá trị pháp lý trên file mới.'
		],
		faqs: [
			{
				question: 'Xóa trang có xóa luôn file gốc trên máy tôi không?',
				answer: 'Không. Trình duyệt chỉ tạo file mới để bạn tải về. File gốc trong thư mục của bạn không bị đổi.'
			},
			{
				question: 'Làm sao bỏ chọn một trang?',
				answer: 'Bấm lại trang đã chọn, hoặc dùng nút Bỏ chọn tất cả.'
			}
		]
	},
	{
		id: 'rotate',
		slug: 'xoay-pdf',
		title: 'Xoay PDF',
		nav: 'Xoay PDF',
		short: 'Xoay từng trang hoặc cả tài liệu theo góc 90 độ.',
		description:
			'Xoay PDF theo từng trang hoặc toàn bộ tài liệu. Xem hướng mới trên thumbnail rồi tải file đã xoay, không cần đăng ký.',
		keywords: 'xoay pdf, xoay trang pdf, rotate pdf online',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Lưu trang đã xoay',
		steps: [
			'Tải PDF cần xoay.',
			'Xoay từng trang hoặc bấm xoay tất cả.',
			'Lưu và tải file kết quả.'
		],
		paragraphs: [
			'Trang scan ngang dọc lẫn lộn có thể đọc khó trên điện thoại. Công cụ xoay đổi hướng hiển thị của từng trang mà không vẽ lại nội dung.',
			'Mỗi lần bấm là một góc 90 độ theo chiều kim đồng hồ. Bạn có thể xoay riêng một trang hoặc áp dụng cho cả tài liệu rồi chỉnh lại trang ngoại lệ.',
			'Nếu PDF có chữ ký số, việc xoay làm chữ ký không còn hợp lệ. Hãy chỉ xoay bản sao làm việc khi bản ký cần được giữ nguyên.'
		],
		faqs: [
			{
				question: 'Xoay có làm mờ chữ không?',
				answer: 'Không. Sổ đổi thuộc tính hướng trang, không xuất trang thành ảnh rồi tạo lại PDF.'
			},
			{
				question: 'Tôi xoay nhầm thì sao?',
				answer: 'Bấm tiếp trên trang đó cho đến khi hướng đúng, hoặc đặt lại trước khi lưu.'
			}
		]
	},
	{
		id: 'organize',
		slug: 'sap-xep-trang-pdf',
		title: 'Sắp xếp trang PDF',
		nav: 'Sắp xếp trang',
		short: 'Kéo thả thumbnail để đổi thứ tự trang.',
		description:
			'Sắp xếp lại thứ tự trang PDF bằng kéo thả. Xem thumbnail, đưa trang lên xuống và tải tài liệu theo thứ tự mới.',
		keywords: 'sắp xếp trang pdf, đổi thứ tự trang pdf, organize pdf',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Lưu thứ tự mới',
		steps: [
			'Mở PDF cần sắp xếp.',
			'Kéo trang tới vị trí mới hoặc dùng nút mũi tên.',
			'Tải file theo thứ tự vừa chỉnh.'
		],
		paragraphs: [
			'Sắp xếp trang giúp đưa mục lục, bìa hoặc phụ lục về đúng chỗ mà không cần phần mềm máy tính. Mọi trang gốc vẫn được giữ, chỉ đổi vị trí.',
			'Với tài liệu dài, thumbnail được vẽ lười: chỉ những trang gần vùng nhìn thấy mới được render, rồi bộ nhớ ảnh cũ được giải phóng.',
			'Thứ tự mới tạo một PDF khác với file gốc. Nếu tài liệu đã ký số, bản sắp xếp lại không còn chữ ký hợp lệ.'
		],
		faqs: [
			{
				question: 'Có thể vừa xóa vừa sắp xếp không?',
				answer: 'Công cụ này giữ đủ mọi trang. Nếu cần bỏ bớt, hãy dùng Xóa trang PDF trước.'
			},
			{
				question: 'Kéo thả trên điện thoại có được không?',
				answer: 'Có. Ngoài kéo thả, mỗi trang có nút đưa lên và đưa xuống cho màn hình cảm ứng và bàn phím.'
			}
		]
	},
	{
		id: 'images-to-pdf',
		slug: 'anh-sang-pdf',
		title: 'JPG/PNG sang PDF',
		nav: 'Ảnh sang PDF',
		short: 'Xếp ảnh JPG hoặc PNG thành một file PDF.',
		description:
			'Chuyển một hoặc nhiều ảnh JPG, PNG thành PDF. Chọn khổ A4 hoặc vừa với ảnh, sắp xếp thứ tự rồi tải về.',
		keywords: 'jpg sang pdf, png sang pdf, ảnh sang pdf, image to pdf',
		accept: 'image/jpeg,image/png,.jpg,.jpeg,.png',
		multiple: true,
		kind: 'image',
		action: 'Tạo PDF',
		steps: [
			'Chọn một hoặc nhiều ảnh JPG hoặc PNG.',
			'Sắp xếp thứ tự và chọn khổ giấy.',
			'Tạo PDF rồi tải về.'
		],
		paragraphs: [
			'Ảnh chụp giấy tờ, biên lai hoặc bài tập có thể gộp thành một PDF để gửi mail hoặc nộp hồ sơ. Sổ nhúng ảnh gốc vào trang PDF, không chuyển ảnh qua một định dạng trung gian khác.',
			'Khổ A4 căn ảnh vào giữa trang, có chừa lề. Chế độ vừa với ảnh để trang PDF bám kích thước ảnh, phù hợp ảnh chụp toàn trang.',
			'WebP, HEIC và GIF chưa được hỗ trợ. Hãy xuất ảnh sang JPG hoặc PNG trước nếu máy ảnh đang để định dạng đó.'
		],
		faqs: [
			{
				question: 'Ảnh có bị nén thêm không?',
				answer: 'Ảnh JPG và PNG được nhúng gần như nguyên tệp. Trang A4 chỉ thu nhỏ cách hiển thị, không encode lại ảnh.'
			},
			{
				question: 'Tôi thêm ảnh theo thứ tự sai thì sao?',
				answer: 'Kéo các ảnh trong danh sách để đổi chỗ trước khi tạo PDF.'
			}
		]
	},
	{
		id: 'pdf-to-images',
		slug: 'pdf-sang-anh',
		title: 'PDF sang JPG/PNG',
		nav: 'PDF sang ảnh',
		short: 'Xuất trang PDF thành ảnh JPG hoặc PNG, chọn độ nét.',
		description:
			'Chuyển các trang PDF thành ảnh JPG hoặc PNG. Chọn trang cần xuất, định dạng và độ nét, rồi tải từng ảnh hoặc file zip.',
		keywords: 'pdf sang jpg, pdf sang png, xuất trang pdf thành ảnh',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Xuất ảnh',
		steps: [
			'Tải PDF cần xuất.',
			'Chọn trang, định dạng JPG hoặc PNG và độ nét.',
			'Xuất ảnh và tải về.'
		],
		paragraphs: [
			'Xuất ảnh khi biểu mẫu chỉ nhận JPG, hoặc khi bạn cần đăng một trang PDF lên nơi không xem được PDF. Mỗi trang được vẽ thành một ảnh riêng.',
			'JPG cho kích thước nhỏ hơn, phù hợp trang chữ và ảnh chụp. PNG giữ vùng sắc nét hơn, hợp trang có sơ đồ hoặc chữ nhỏ. Độ nét cao tạo ảnh lớn và tốn bộ nhớ hơn.',
			'PDF có mật khẩu vẫn xuất được trên trình duyệt sau khi bạn nhập đúng mật khẩu. File không bị gửi lên máy chủ cho thao tác này.'
		],
		faqs: [
			{
				question: 'Vì sao không nên luôn chọn độ nét cao nhất?',
				answer:
					'Độ nét cao tạo ảnh rất lớn và có thể làm máy yếu bị đơ. Hãy dùng mức rõ cho tài liệu thông thường, mức rất rõ khi cần đọc chữ nhỏ.'
			},
			{
				question: 'Ảnh xuất ra có chọn được văn bản không?',
				answer: 'Không. Kết quả là ảnh của trang, không phải lớp chữ có thể bôi đen.'
			}
		]
	},
	{
		id: 'page-numbers',
		slug: 'danh-so-trang',
		title: 'Đánh số trang PDF',
		nav: 'Đánh số trang',
		short: 'Thêm số trang ở đầu hoặc cuối, chọn số bắt đầu.',
		description:
			'Đánh số trang PDF với vị trí, cỡ chữ và số bắt đầu tùy chọn. Có thể bỏ qua trang đầu và tải file đã đánh số.',
		keywords: 'đánh số trang pdf, thêm số trang pdf, page numbers pdf',
		accept: 'application/pdf,.pdf',
		multiple: false,
		kind: 'pdf',
		action: 'Đánh số trang',
		steps: [
			'Mở PDF cần đánh số.',
			'Chọn vị trí, kiểu số, số bắt đầu và cỡ chữ.',
			'Thêm số trang và tải file mới.'
		],
		paragraphs: [
			'Số trang giúp bản in và bản gửi đi dễ đối chiếu. Bạn đặt số ở sáu vị trí: trái, giữa, phải của đầu trang hoặc cuối trang.',
			'Số bắt đầu không bắt buộc phải là 1. Một chương tiếp theo có thể bắt đầu từ trang 12. Có thể bỏ qua trang bìa và viết theo dạng chỉ số, số trên tổng, hoặc chữ Trang kèm số.',
			'Số được vẽ thêm bằng font chuẩn, không sửa câu chữ sẵn có trong PDF. Nếu nền trang cùng màu với số, hãy đổi sang màu trắng hoặc đen. Chữ ký số sẽ hết hiệu lực sau khi thêm số trang.'
		],
		faqs: [
			{
				question: 'Đánh số có làm hỏng chữ sẵn trên trang không?',
				answer:
					'Số được vẽ thêm ở mép trang. Nếu mép đã có nội dung, hãy tăng lề hoặc đổi vị trí để số không đè lên chữ.'
			},
			{
				question: 'Tôi có bỏ qua trang bìa được không?',
				answer: 'Có. Bật tùy chọn bỏ qua trang đầu. Trang tiếp theo nhận số bắt đầu bạn đã chọn.'
			}
		]
	}
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string) {
	return bySlug.get(slug);
}

export function isToolSlug(slug: string) {
	return bySlug.has(slug);
}
