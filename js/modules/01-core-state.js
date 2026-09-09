// Module: 01-core-state.js (Smart GovReport Hub 2.5)
    // Master State for Profile & Training Metadata
    const defaultProfileData = {
      orgName: "สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร",
      orgAddr: "อาคารรัฐประศาสนภักดี ศูนย์ราชการเฉลิมพระเกียรติฯ ถ.แจ้งวัฒนะ กทม. 10210",
      orgPhone: "0 2141 9999",
      orgFax: "0 2143 8888",
      supervisorName: "นางสาวสรินยา สุวรรณวณิช",
      supervisorPos: "ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ",
      traineeName: "นายเจค (นิติพัฒน์ คุ้มวงษ์)",
      traineeNick: "เจค",
      traineeDisability: "ทางการเคลื่อนไหวหรือทางร่างกาย",
      traineePhone: "081-234-5678",
      traineeEmail: "carinojake@gmail.com",
      curriculum: {
        w1: { dates: "1 - 4 ก.ย. 69", title: "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ", hours: "22.5 ชม." },
        w2: { dates: "7 - 11 ก.ย. 69", title: "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง", hours: "22.5 ชม." },
        w3: { dates: "14 - 18 ก.ย. 69", title: "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA", hours: "22.5 ชม." },
        w4: { dates: "21 - 25 ก.ย. 69", title: "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio", hours: "22.5 ชม." },
        w5: { enabled: true, dates: "28 - 30 ก.ย. 69", title: "-", hours: "13.5 ชม." }
      },
      signDateCover: "30 กันยายน 2569"
    };

    let profileData = JSON.parse(JSON.stringify(defaultProfileData));

    // Starter template for newly registered trainees (Isolated 1:1 Logbook)
    const emptyOjtWeeklyData = {
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": []
    };

    // Master Default State for Tab 4: Official Memorandum (บันทึกข้อความ ส่วนราชการ)
    const defaultOfficialMemoData = {
      orgName: "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม โทร. 0 2141 9999",
      docNo: "ยธ 0204 / ว 01 / 2569",
      date: "3 กันยายน 2569",
      subject: "รายงานผลการดำเนินงานโครงการพัฒนาระบบ Smart GovReport Hub 2.5 (เวอร์ชัน 1.0)",
      recipient: "ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ / ผู้ควบคุมการฝึกงาน",
      origin: "ตามที่ข้าพเจ้า นายนิติพัฒน์ คุ้มวงษ์ ได้รับมอบหมายให้เข้ารับการฝึกปฏิบัติงานในหลักสูตรเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ รุ่นที่ 1 และได้รับมอบหมายภารกิจในการออกแบบและพัฒนาระบบนวัตกรรมดิจิทัล \"Smart GovReport Hub 2.5\" เพื่อยกระดับการบันทึกสมุดปฏิบัติงาน OJT และระบบคลังผลงานดิจิทัลภาครัฐ นั้น",
      factsIntro: "บัดนี้ การพัฒนาระบบ Smart GovReport Hub 2.5 (เวอร์ชัน 1.0) ได้ดำเนินการแล้วเสร็จตามแผนงาน Sprint ที่ 1–2 เป็นที่เรียบร้อยแล้ว โดยมีผลสัมฤทธิ์ที่สำคัญดังนี้:",
      considerationsIntro: "เพื่อให้การดำเนินงานโครงการเป็นไปด้วยความเรียบร้อยและต่อเนื่อง จึงเห็นควรดำเนินการดังต่อไปนี้:",
      signName: "นายนิติพัฒน์ คุ้มวงษ์",
      signPos: "ผู้จัดทำรายงาน / นักวิชาการคอมพิวเตอร์"
    };
    let officialMemoData = JSON.parse(JSON.stringify(defaultOfficialMemoData));

    // Master Default State for Tab 5: Executive Portfolio (แฟ้มสะสมผลงาน 13 ปีของเจค)
    const defaultPortfolioData = {
      traineeName: "นายเจค (นิติพัฒน์ คุ้มวงษ์)",
      headline: "ผู้เชี่ยวชาญระบบเทคโนโลยีสารสนเทศ การบริหารฐานข้อมูล และเครือข่ายคอมพิวเตอร์ (ประสบการณ์ 13 ปี)",
      trackBadge: "✓ Advanced Track (BB 211)",
      hoursBadge: "✓ OJT 90 ชม. สมบูรณ์",
      experiences: [
        {
          role: "เจ้าหน้าที่ระบบคอมพิวเตอร์",
          org: "สภากาชาดไทย",
          period: "พ.ศ. 2565 – 2567 (2 ปี)",
          desc: "ดูแลและบำรุงรักษาเครื่องแม่ข่าย (Server), ระบบเครือข่าย (Network) และแก้ไขปัญหาไอทีเชิงเทคนิคให้บุคลากร"
        },
        {
          role: "นักวิชาการคอมพิวเตอร์",
          org: "กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ",
          period: "พ.ศ. 2556 – 2565 (9 ปี)",
          desc: "ออกแบบระบบฐานข้อมูลผู้สูงอายุ, พัฒนาระบบรับชำระผ่าน Counter Service, ขับเคลื่อนงาน PMQA และการจัดการความรู้ (KM)"
        },
        {
          role: "IT Support & Web Developer",
          org: "เวิลด์เอ็นเตอร์เทนเม้นท์เน็ทเวิร์ค",
          period: "พ.ศ. 2554 – 2556 (2 ปี)",
          desc: "พัฒนาเว็บไซต์องค์กร, แก้ไขปัญหา Hardware/Network, บริหารช่องทางสื่อออนไลน์"
        }
      ],
      skills: {
        data: "PivotTable, Slicer, Formulas, Dashboard",
        code: "PHP, MySQL, HTML5, JavaScript",
        gov: "e-Saraban, ThaiD, Data Governance",
        ai: "Prompt R-C-T-F, Agile, Project Canvas"
      },
      vision: "มุ่งมั่นนำทักษะและความเชี่ยวชาญด้านไอทีตลอด 13 ปี มาร่วมขับเคลื่อนและพัฒนาระบบดิจิทัลของหน่วยงานภาครัฐ เพิ่มประสิทธิภาพการบริการประชาชนอย่างไร้รอยต่อ และสร้างระบบงานสารบรรณอิเล็กทรอนิกส์ที่ปลอดภัย โปร่งใส และทุกคนเข้าถึงได้อย่างเท่าเทียม"
    };
    let portfolioData = JSON.parse(JSON.stringify(defaultPortfolioData));

    // Template for new trainees (Tab 5)
    const emptyPortfolioTemplate = {
      traineeName: "",
      headline: "ผู้เข้ารับการฝึกอบรมเตรียมความพร้อมสำหรับการจ้างงานคนพิการภาครัฐ รุ่นที่ 1",
      trackBadge: "✓ Standard OJT Track",
      hoursBadge: "⏳ OJT กำลังบันทึก",
      experiences: [],
      skills: {
        data: "Excel, Google Sheets, Word",
        code: "Web App, Google Form, Canva",
        gov: "e-Saraban, ระเบียบงานสารบรรณ",
        ai: "Prompt R-C-T-F, Project Canvas"
      },
      vision: "มุ่งมั่นนำทักษะทางเทคโนโลยีดิจิทัลมาสนับสนุนและพัฒนางานบริการภาครัฐอย่างเต็มกำลังความสามารถ เพื่อขับเคลื่อนการปฏิบัติงานที่รวดเร็ว โปร่งใส และเป็นประโยชน์สูงสุดต่อประชาชน"
    };

    // Master Initial State for Project Summary & Canvas (Tab 3)
    const initialProjectSummaryData = {
      headerTitle: "รายงานสรุปแผนงานและผลลัพธ์โครงการ (Project Canvas & 12 Steps)",
      headerSubtitle: "โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ",
      projectTitle: "รายงานผลการดำเนินงานโครงการพัฒนาระบบคลังผลงานดิจิทัลและบริหารจัดการข้อมูลคนพิการภาครัฐ",
      orgResponsible: "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร ร่วมกับ สถาบันส่งเสริมการบริหารกิจการบ้านเมืองที่ดี",
      statusBadge: "สถานะ: ดำเนินการแล้วเสร็จ",
      execSummary: "โครงการนี้จัดทำขึ้นเพื่อยกระดับขีดความสามารถของบุคลากรภาครัฐผู้พิการตามกรอบ 7 ทักษะดิจิทัล และการทำงานแบบ Agile โดยประยุกต์ใช้ระบบคลังผลงานดิจิทัล (e-Portfolio & Analytics) ในการเก็บข้อมูลผลการฝึกงาน OJT 90 ชั่วโมง และการวิเคราะห์ข้อมูลสารสนเทศโครงการ ผลการดำเนินงานสามารถเพิ่มประสิทธิภาพการจัดเก็บเอกสารแบบไร้กระดาษ (Paperless) ได้ 100% สอดคล้องตามมาตรฐานความมั่นคงปลอดภัย พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และมาตรฐานการเข้าถึง WCAG 2.1 AA",
      canvas: {
        problem: "การรายงานผลจ้างงานคนพิการเดิมซ้ำซ้อน เอกสารกระดาษสูญหายง่าย ขาดระบบจัดเก็บสมรรถนะดิจิทัล",
        objective: "พัฒนา Web App สำหรับบันทึก OJT และสร้างเล่ม Portfolio มาตรฐานภาครัฐในไฟล์เดียว",
        target: "ผู้เข้าอบรมคนพิการรุ่นที่ 1, หัวหน้างานฝ่ายสารบรรณ/ไอที และคณะกรรมการประเมินผล",
        activities: "Sprint 1: ออกแบบ UI/UX, Sprint 2: พัฒนาระบบบันทึก OJT & AI Polish, Sprint 3: ทดสอบ Accessibility",
        kpis: "ชั่วโมงฝึกงานครบ 90 ชม. (100%), อัตราความพึงพอใจ > 92%, ผ่านเกณฑ์ WCAG 2.1 AA",
        raci: "R: คุณเจค (IT Dev), A: ผอ.กลุ่มงาน, C: วิทยากร BDI/ก.พ.ร., I: ผู้เข้าอบรมรุ่น 1"
      },
      steps: [
        { no: 1, title: "ร่างโครงการและแผนปฏิบัติการ", status: "ดำเนินการแล้วเสร็จ", owner: "เจ้าหน้าที่วิเคราะห์นโยบายและแผน" },
        { no: 2, title: "บันทึกข้อความขออนุมัติจัดกิจกรรม", status: "ได้รับอนุมัติแล้ว", owner: "หัวหน้างานสารบรรณ / ผู้บริหาร" },
        { no: 3, title: "การวิเคราะห์และ Dashboard ข้อมูลผู้เรียน", status: "สมบูรณ์ (Chart.js)", owner: "นักวิชาการคอมพิวเตอร์ (คุณเจค)" },
        { no: 4, title: "ตรวจสอบ Accessibility (WCAG 2.1 AA)", status: "ผ่านการทดสอบ 100%", owner: "ผู้เชี่ยวชาญสิ่งอำนวยความสะดวก" },
        { no: 5, title: "มาตรการคุ้มครองข้อมูลส่วนบุคคล (PDPA)", status: "จัดทำ Consent ครบถ้วน", owner: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)" },
        { no: 6, title: "จัดเตรียมสภาพแวดล้อมและระบบ Local Database", status: "ดำเนินการแล้วเสร็จ", owner: "ทีมพัฒนาระบบไอที" },
        { no: 7, title: "การทดสอบระบบและเก็บข้อมูล OJT รายสัปดาห์", status: "ดำเนินการแล้วเสร็จ", owner: "ผู้ฝึกภาคปฏิบัติ & ผู้ควบคุมงาน" },
        { no: 8, title: "การปรับแต่งการแสดงผลและ Print Engine A4", status: "สมบูรณ์ 100%", owner: "Frontend Developer" },
        { no: 9, title: "การวิเคราะห์และตรวจสอบความปลอดภัยของข้อมูล", status: "ผ่านเกณฑ์มาตรฐาน", owner: "คณะทำงานกำกับดูแล" },
        { no: 10, title: "จัดทำสรุปบทวิเคราะห์เปรียบเทียบ (Dual-Mode Matrix)", status: "ดำเนินการแล้วเสร็จ", owner: "ผู้ฝึกภาคปฏิบัติ" },
        { no: 11, title: "ประเมินสมรรถนะและการนำเสนอผลงาน Portfolio", status: "ดำเนินการแล้วเสร็จ", owner: "คณะกรรมการประเมินผล" },
        { no: 12, title: "ส่งมอบคู่มือการใช้งานและเอกสารรับรองปิดโครงการ", status: "ดำเนินการแล้วเสร็จ", owner: "ผู้ควบคุมการฝึกงาน" }
      ],
      reporterName: "นายเจค (นิติพัฒน์ คุ้มวงษ์)",
      reporterPos: "นักวิชาการคอมพิวเตอร์ / ผู้ดูแลระบบคลังข้อมูล"
    };

    let projectSummaryData = JSON.parse(JSON.stringify(initialProjectSummaryData));
    let isDirectEditMode = false;

    // Master Initial OJT Weekly Data (Structured for Dual-Mode: Brief for A4 + Full Evidence & SOP)
        const curatedOjtPhotos = {
      "1-1": [
            {
                  "url": "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: บรรยากาศการเข้ารับการปฐมนิเทศและรับมอบนโยบายการปฏิบัติราชการ"
            },
            {
                  "url": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ศึกษาระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526"
            }
      ],
      "1-2": [
            {
                  "url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ฝึกพิมพ์และจัดระยะขอบกระดาษมาตรฐาน A4 บันทึกข้อความภายใน"
            },
            {
                  "url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ตรวจสอบความถูกต้องของแบบฟอร์มตราครุฑร่วมกับผู้ควบคุมงาน"
            }
      ],
      "1-3": [
            {
                  "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ทดสอบการใช้งานระบบสารบรรณอิเล็กทรอนิกส์ (e-Saraban)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ฝึกรับ-ส่งหนังสือเวียนและการลงลายมือชื่ออิเล็กทรอนิกส์"
            }
      ],
      "1-4": [
            {
                  "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: บันทึกข้อมูลลงในสมุดทะเบียนคุมหนังสือรับ-ส่งราชการ"
            },
            {
                  "url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ตรวจสอบเลขที่หนังสือและรหัสพยัญชนะประจำกระทรวง"
            }
      ],
      "1-5": [
            {
                  "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: สรุปผลการปฏิบัติงานสัปดาห์ที่ 1 ร่วมกับผู้ควบคุมงาน"
            },
            {
                  "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: รับฟังข้อเสนอแนะและแผนการพัฒนาในสัปดาห์ถัดไป"
            }
      ],
      "2-1": [
            {
                  "url": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ฝึกคัดแยกเอกสารตามชั้นความลับและชั้นความเร็ว"
            },
            {
                  "url": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ออกแบบการจัดเก็บเอกสารอิเล็กทรอนิกส์ที่มีชั้นความลับ"
            }
      ],
      "2-2": [
            {
                  "url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ทดสอบการเชื่อมโยงระบบยืนยันตัวตนดิจิทัลภาครัฐ (ThaiD)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ตรวจสอบความปลอดภัยสารสนเทศตามมาตรฐาน ISO/IEC 27001"
            }
      ],
      "2-3": [
            {
                  "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: การทำความสะอาดข้อมูล (Data Cleaning) ฐานข้อมูลทะเบียนคุม"
            },
            {
                  "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: จัดระเบียบโครงสร้างข้อมูลผู้รับบริการให้พร้อมสำหรับการวิเคราะห์"
            }
      ],
      "2-4": [
            {
                  "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: สร้างตารางสรุปสถิติด้วย PivotTable & Power Query"
            },
            {
                  "url": "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ออกแบบฟังก์ชันคำนวณและกราฟแสดงผลสรุปสถิติ"
            }
      ],
      "2-5": [
            {
                  "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ประชุมติดตามความก้าวหน้าโครงการประจำสัปดาห์ (Weekly Stand-up)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: รายงานผลการดำเนินงานและรับมอบหมายภารกิจสัปดาห์ที่ 3"
            }
      ],
      "3-1": [
            {
                  "url": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ออกแบบโครงสร้างคลังผลงานดิจิทัล (Digital Portfolio Schema)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: จัดทำ Wireframe หน้าจอการแสดงผลคลังผลงาน"
            }
      ],
      "3-2": [
            {
                  "url": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ตรวจสอบความสอดคล้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: จัดทำแบบยินยอม (Consent Form) และนโยบายความเป็นส่วนตัว"
            }
      ],
      "3-3": [
            {
                  "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: พัฒนาหน้าจอ Dashboard Layout ด้วย Chart.js และ Tailwind CSS"
            },
            {
                  "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ปรับแต่งการแสดงผลกราฟสถิติแบบ Responsive"
            }
      ],
      "3-4": [
            {
                  "url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ทดสอบความสามารถในการเข้าถึงตามเกณฑ์มาตรฐาน WCAG 2.1 AA"
            },
            {
                  "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ตรวจสอบ Contrast Ratio และ Screen Reader สำหรับคนพิการ"
            }
      ],
      "3-5": [
            {
                  "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ทดสอบระบบร่วมกับผู้ใช้งานและบันทึก Feedback"
            },
            {
                  "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ปรับปรุงประสิทธิภาพของระบบตามข้อเสนอแนะ"
            }
      ],
      "4-1": [
            {
                  "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: วิเคราะห์ข้อมูลสารสนเทศโครงการ ด้วย PivotTable และ Slicer"
            },
            {
                  "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: สร้างแบบจำลองข้อมูลและจัดกลุ่มตัวชี้วัดความสำเร็จ"
            }
      ],
      "4-2": [
            {
                  "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ออกแบบและสร้าง Executive Dashboard สำหรับผู้บริหาร"
            },
            {
                  "url": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ทดสอบระบบโต้ตอบและกรองข้อมูลแบบ Real-time"
            }
      ],
      "4-3": [
            {
                  "url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: วางแผนโครงการและแตกงานย่อยด้วย Project Canvas 9 ช่อง"
            },
            {
                  "url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: กำหนดบทบาทหน้าที่ตาม RACI Matrix และรอบการทำงาน Agile"
            }
      ],
      "4-4": [
            {
                  "url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: ตรวจสอบความพร้อมของระบบตามมาตรฐาน WCAG 2.1 AA และ PDPA"
            },
            {
                  "url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ทดสอบมาตรการรักษาความปลอดภัยข้อมูลก่อนการส่งมอบ"
            }
      ],
      "4-5": [
            {
                  "url": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: จัดทำรูปเล่มรายงานสมบูรณ์ครบถ้วน 90 ชั่วโมง"
            },
            {
                  "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: นำเสนอผลงาน Portfolio ต่อคณะกรรมการประเมินผล"
            }
      ],
      "5-1": [
            {
                  "url": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: นำเสนอรายงานผลสัมฤทธิ์ OJT และสาธิตระบบต่อผู้บริหาร"
            },
            {
                  "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ตอบข้อซักถามเชิงเทคนิคและการประยุกต์ใช้งานในหน่วยงาน"
            }
      ],
      "5-2": [
            {
                  "url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: จัดทำเอกสารคู่มือการใช้งานระบบ (User Manual)"
            },
            {
                  "url": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ส่งมอบ Source Code และเอกสารสถาปัตยกรรมระบบ"
            }
      ],
      "5-3": [
            {
                  "url": "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 1: พิธีปิดโครงการฝึกภาคปฏิบัติและประเมินผลสมรรถนะ"
            },
            {
                  "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
                  "caption": "ภาพที่ 2: ลงนามรับรองปิดโครงการร่วมกับผู้ควบคุมงาน"
            }
      ]
};

    const initialOjtWeeklyData = {
      1: [
        {
          id: "1-1",
          date: "จันทร์ 1 ก.ย. 69",
          hours: 4.5,
          task: "ปฐมนิเทศหน่วยงาน ศึกษาระเบียบโครงสร้างราชการ และระบบสารบรรณ",
          skill: "เข้าใจระบบสายการบังคับบัญชา และระเบียบสำนักนายกฯ 2526",
          blocker: "ไม่มี",
          steps: "1. เข้ารับการปฐมนิเทศและรับฟังนโยบายการปฏิบัติราชการจากผู้อำนวยการกลุ่มงานสารสนเทศ\n2. ศึกษาระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526 และที่แก้ไขเพิ่มเติม\n3. สำรวจโครงสร้างสายการบังคับบัญชา แผนผังองค์กร และสิทธิ์การเข้าถึงข้อมูลภายในหน่วยงาน",
          tools: "คู่มือระเบียบสารบรรณ 2526, แผนผังโครงสร้างสำนักงานปลัดกระทรวง (Org Chart)",
          artifacts: "Orientation_Checklist.pdf, Org_Structure_Notes.docx",
          impact: "ช่วยให้เข้าใจระเบียบปฏิบัติราชการอย่างถูกต้อง ป้องกันข้อผิดพลาดในการเดินเอกสารหนังสือราชการ",
          images: curatedOjtPhotos["1-1"]
        },
        {
          id: "1-2",
          date: "อังคาร 2 ก.ย. 69",
          hours: 4.5,
          task: "ฝึกร่างหนังสือราชการภายนอกและบันทึกข้อความภายใน",
          skill: "การจัดระยะขอบกระดาษ ตราครุฑ และภาษาทางการ 3 ส่วน",
          blocker: "ระมัดระวังคำขึ้นต้น-ลงท้าย",
          steps: "1. ศึกษารูปแบบหนังสือภายนอกและบันทึกข้อความภายในตามระเบียบงานสารบรรณ\n2. ฝึกตั้งค่าระยะขอบกระดาษมาตรฐาน A4 (บน 2.5 ซม. ซ้าย 3 ซม. ขวา 2 ซม. ล่าง 2 ซม.) และวางตราครุฑ 3 ซม.\n3. ร่างบันทึกข้อความโดยใช้โครงสร้าง 3 ย่อหน้าทางการ (ต้นเรื่อง, ข้อเท็จจริง, ข้อพิจารณา)",
          tools: "Microsoft Word (Thai Sarabun PSK 16pt), แม่แบบบันทึกข้อความราชการ (Gov Memo Template)",
          artifacts: "Draft_Official_Memo_v1.docx, Garuda_Margin_Standard.pdf",
          impact: "สามารถร่างหนังสือราชการได้ถูกต้องตามระเบียบ 100% ลดเวลาการตรวจแก้ของผู้บังคับบัญชา",
          images: curatedOjtPhotos["1-2"]
        },
        {
          id: "1-3",
          date: "พุธ 3 ก.ย. 69",
          hours: 4.5,
          task: "ศึกษาการใช้งานระบบสารบรรณอิเล็กทรอนิกส์ (e-Saraban)",
          skill: "การรับ-ส่งเอกสารราชการอิเล็กทรอนิกส์ตาม พ.ร.บ. 2565",
          blocker: "ทำความเข้าใจสิทธิ์ RBAC",
          steps: "1. ศึกษาระบบ e-Saraban ภาครัฐ ตาม พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์ พ.ศ. 2565\n2. ทดสอบการล็อกอินผ่านระบบ Single Sign-On (SSO) และตรวจสอบสิทธิ์ผู้ใช้งานตามบทบาท (Role-Based Access Control)\n3. ฝึกรับหนังสือเข้า แทงเรื่อง มอบหมายงาน และส่งหนังสือเวียนภายในระบบ",
          tools: "Gov e-Saraban Simulator, Digital Signature Module, RBAC Config",
          artifacts: "eSaraban_User_Guide.pdf, Role_Access_Matrix.xlsx",
          impact: "เพิ่มทักษะการทำงานแบบ Paperless สอดรับกับเป้าหมายรัฐบาลดิจิทัล (Digital Government)",
          images: curatedOjtPhotos["1-3"]
        },
        {
          id: "1-4",
          date: "พฤหัสบดี 4 ก.ย. 69",
          hours: 4.5,
          task: "ฝึกจัดทำทะเบียนคุมหนังสือรับและหนังสือส่งออกของหน่วยงาน",
          skill: "การลงรหัสพยัญชนะประจำกระทรวง และการกำหนดเลขที่",
          blocker: "ไม่มี",
          steps: "1. เรียนรู้หลักการกำหนดเลขที่หนังสือ รหัสตัวพยัญชนะ และเลขประจำของเจ้าของเรื่อง\n2. ฝึกบันทึกข้อมูลหนังสือรับ-ส่ง ลงในสมุดทะเบียนคุมดิจิทัล\n3. ตรวจสอบความถูกต้องของวันเวลาที่รับ และการออกเลขหนังสือส่ง",
          tools: "ระบบทะเบียนคุมหนังสือราชการ, Google Sheets Template ทะเบียนคุม",
          artifacts: "Document_Log_Book_Sept2026.xlsx, Gov_Prefix_Reference.pdf",
          impact: "ช่วยให้การติดตามสถานะหนังสือราชการมีความรวดเร็ว แม่นยำ และตรวจสอบย้อนหลังได้ทันที",
          images: curatedOjtPhotos["1-4"]
        },
        {
          id: "1-5",
          date: "ศุกร์ 5 ก.ย. 69",
          hours: 4.5,
          task: "สรุปผลการปฏิบัติงานสัปดาห์ที่ 1 และรับคำแนะนำจากหัวหน้างาน",
          skill: "การสะท้อนคิดและการทำงานร่วมกับทีมงานธุรการ",
          blocker: "ไม่มี",
          steps: "1. รวบรวมสถิติหนังสือราชการที่ได้จัดทำในสัปดาห์ที่ 1 รวม 22.5 ชั่วโมง\n2. นำเสนอสรุปผลงานต่อผู้ควบคุมการฝึกงาน (นางสาวสรินยา สุวรรณวณิช)\n3. รับฟังข้อเสนอแนะเพื่อนำมาปรับปรุงการปฏิบัติงานในสัปดาห์ถัดไป",
          tools: "Weekly Evaluation Form, OJT Weekly Report Sheet",
          artifacts: "Weekly_Summary_W1.pdf, Supervisor_Feedback_Note.docx",
          impact: "ได้รับการประเมินผลสัมฤทธิ์ระดับดีเยี่ยม และมีความพร้อมในการก้าวสู่การบริหารจัดการฐานข้อมูล",
          images: curatedOjtPhotos["1-5"]
        }
      ],
      2: [
        {
          id: "2-1",
          date: "จันทร์ 8 ก.ย. 69",
          hours: 4.5,
          task: "ฝึกคัดแยกและจัดหมวดหมู่เอกสารลับ/เอกสารด่วนตามระเบียบสารบรรณ",
          skill: "หลักเกณฑ์ชั้นความลับและชั้นความเร็วของเอกสารราชการ",
          blocker: "ไม่มี",
          steps: "1. ศึกษาชั้นความเร็ว (ด่วนที่สุด, ด่วนมาก, ด่วน) และชั้นความลับ (ลับที่สุด, ลับมาก, ลับ)\n2. ฝึกประทับตราชั้นความเร็วสีแดงที่มุมบนด้านซ้ายของเอกสาร\n3. ออกแบบแนวทางการจัดเก็บเอกสารอิเล็กทรอนิกส์ที่มีชั้นความลับอย่างปลอดภัย",
          tools: "ระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544, แม่แบบตราประทับดิจิทัล",
          artifacts: "Urgent_Confidential_Guidelines.pdf, Classified_Doc_Sample.docx",
          impact: "ทำให้กระบวนการส่งต่อเอกสารเร่งด่วนเป็นไปอย่างถูกต้อง ไม่เกิดความล่าช้าในภารกิจสำคัญ",
          images: curatedOjtPhotos["2-1"]
        },
        {
          id: "2-2",
          date: "อังคาร 9 ก.ย. 69",
          hours: 4.5,
          task: "ทดสอบการเชื่อมโยงระบบยืนยันตัวตนดิจิทัลภาครัฐ (ThaiD)",
          skill: "ความปลอดภัยสารสนเทศตามมาตรฐาน ISO/IEC 27001",
          blocker: "ไม่มี",
          steps: "1. ศึกษาสถาปัตยกรรมการพิสูจน์และยืนยันตัวตนทางดิจิทัลผ่านแอปพลิเคชัน ThaiD (DOPA Open API)\n2. ทดสอบขั้นตอน Authentication Flow (OAuth 2.0 / OpenID Connect)\n3. ออกแบบ Security Checklist สำหรับระบบบริการภาครัฐ",
          tools: "ThaiD Identity Mockup API, Postman, OAuth 2.0 Debugger",
          artifacts: "ThaiD_Integration_Flowchart.png, Security_Audit_Checklist.pdf",
          impact: "ยกระดับความปลอดภัยในการเข้าถึงข้อมูลส่วนบุคคลของระบบภาครัฐตามมาตรฐานสากล",
          images: curatedOjtPhotos["2-2"]
        },
        {
          id: "2-3",
          date: "พุธ 10 ก.ย. 69",
          hours: 4.5,
          task: "จัดการฐานข้อมูลทะเบียนคุมผู้รับบริการและทำความสะอาดข้อมูล (Data Cleaning)",
          skill: "การตรวจสอบข้อมูลซ้ำซ้อนด้วยคำสั่ง Remove Duplicates",
          blocker: "ไม่มี",
          steps: "1. นำเข้าข้อมูลดิบผู้รับบริการและผู้ลงทะเบียนฝึกอบรม\n2. ตรวจสอบและตัดข้อมูลซ้ำซ้อนด้วยฟังก์ชัน Remove Duplicates และกำจัดช่องว่างด้วย TRIM\n3. ตรวจสอบความถูกต้องของเลขประจำตัวประชาชน 13 หลัก (Mod 11 Checksum)",
          tools: "Microsoft Excel, Power Query, Data Validation Rules",
          artifacts: "Cleaned_Trainee_DB.xlsx, Data_Cleaning_SOP.docx",
          impact: "เพิ่มความถูกต้องของข้อมูล (Data Accuracy) ขึ้นเป็น 100% พร้อมสำหรับนำไปประมวลผลเชิงลึก",
          images: curatedOjtPhotos["2-3"]
        },
        {
          id: "2-4",
          date: "พฤหัสบดี 11 ก.ย. 69",
          hours: 4.5,
          task: "จัดทำสรุปรายงานสถิติประจำสัปดาห์ด้วย Microsoft Excel ขั้นสูง",
          skill: "การใช้ฟังก์ชัน SUMIFS, COUNTIFS, XLOOKUP",
          blocker: "ไม่มี",
          steps: "1. เขียนสูตรสรุปจำนวนผู้เข้ารับบริการจำแนกตามประเภทความพิการด้วย COUNTIFS\n2. ใช้สูตร SUMIFS คำนวณงบประมาณและเวลาอบรมสะสม\n3. ประยุกต์ใช้ XLOOKUP ดึงข้อมูลข้ามตารางอย่างมีประสิทธิภาพ",
          tools: "Excel Advanced Formulas: =SUMIFS(), =COUNTIFS(), =XLOOKUP()",
          artifacts: "Weekly_Stats_Calculator.xlsx, Excel_Formulas_Cheatsheet.pdf",
          impact: "ลดระยะเวลาในการสรุปข้อมูลประจำสัปดาห์จากเดิม 2 ชั่วโมง เหลือเพียง 5 นาที",
          images: curatedOjtPhotos["2-4"]
        },
        {
          id: "2-5",
          date: "ศุกร์ 12 ก.ย. 69",
          hours: 4.5,
          task: "ประชุมติดตามความก้าวหน้าโครงการประจำสัปดาห์ (Weekly Stand-up)",
          skill: "การสื่อสารในทีมแบบ Agile และการสะท้อนผลการทำงาน",
          blocker: "ไม่มี",
          steps: "1. นำเสนอผลการดำเนินงานสัปดาห์ที่ 2 ในการประชุม Weekly Stand-up Meeting\n2. แลกเปลี่ยนความคิดเห็นและร่วมกันระบุอุปสรรคเพื่อแก้ไข (Sprint Retrospective)\n3. บันทึกผลการสะสมเวลา OJT ครบ 45.0 ชั่วโมง (50% ของหลักสูตร)",
          tools: "Miro Board, MS Teams, Weekly Burn-down Chart",
          artifacts: "Sprint2_Meeting_Minutes.pdf, OJT_Milestone_50Percent.png",
          impact: "เสริมสร้างวัฒนธรรมการทำงานแบบ Agile และความโปร่งใสในการรายงานความก้าวหน้า",
          images: curatedOjtPhotos["2-5"]
        }
      ],
      3: [
        {
          id: "3-1",
          date: "จันทร์ 15 ก.ย. 69",
          hours: 4.5,
          task: "ออกแบบโครงร่างคลังผลงานดิจิทัล (Digital Portfolio Schema)",
          skill: "การจัดหมวดหมู่สมรรถนะตามมาตรฐาน ก.พ.ร.",
          blocker: "ไม่มี",
          steps: "1. วิเคราะห์กรอบสมรรถนะหลักและสมรรถนะเฉพาะตามเกณฑ์ของสำนักงาน ก.พ.ร.\n2. ออกแบบโครงสร้างฐานข้อมูล (Entity Relationship Diagram) สำหรับจัดเก็บแฟ้มผลงาน\n3. กำหนดหมวดหมู่ผลงาน 13 ปี (ด้านระบบ Server, Network, Web Dev และ Data Management)",
          tools: "dbdiagram.io, Draw.io, Competency Framework Manual",
          artifacts: "Portfolio_DB_Schema.png, Competency_Matrix_Template.xlsx",
          impact: "ได้สถาปัตยกรรมข้อมูลที่เป็นมาตรฐาน รองรับการสืบค้นผลงานและใบรับรองได้อย่างเป็นระบบ",
          images: curatedOjtPhotos["3-1"]
        },
        {
          id: "3-2",
          date: "อังคาร 16 ก.ย. 69",
          hours: 4.5,
          task: "วิเคราะห์ความสอดคล้องของโครงการกับระเบียบ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)",
          skill: "การจัดทำ Consent Form และการเข้ารหัสข้อมูลสำคัญ",
          blocker: "ไม่มี",
          steps: "1. สำรวจจุดเสี่ยงการละเมิดข้อมูลส่วนบุคคลในการจัดเก็บข้อมูลผู้พิการ\n2. จัดทำแบบฟอร์มขอความยินยอม (Consent Form) และนโยบายความเป็นส่วนตัว (Privacy Notice)\n3. ออกแบบแนวทางการทำ Masking เลขบัตรประชาชน (เช่น 1-1002-XXXXX-XX-X)",
          tools: "PDPA Compliance Checklist, Data Privacy Impact Assessment (DPIA)",
          artifacts: "Consent_Form_Template.pdf, PDPA_Audit_Report.docx",
          impact: "ระบบปฏิบัติตามกฎหมาย PDPA 2562 ครบถ้วน ป้องกันความเสี่ยงทางกฎหมายของหน่วยงาน",
          images: curatedOjtPhotos["3-2"]
        },
        {
          id: "3-3",
          date: "พุธ 17 ก.ย. 69",
          hours: 4.5,
          task: "พัฒนาหน้าจอส่วนนำเสนอข้อมูล (Dashboard Layout) ด้วย Chart.js",
          skill: "การแสดงผลข้อมูลแบบโต้ตอบ (Interactive Data Visualization)",
          blocker: "ไม่มี",
          steps: "1. ออกแบบ Component สำหรับแสดง KPI Cards 4 ตัวชี้วัด\n2. เขียนโค้ดเชื่อมต่อ Chart.js เพื่อแสดง Radar Chart สมรรถนะ 5 ด้าน\n3. ทดสอบการตอบสนองบนอุปกรณ์หน้าจอต่างๆ (Responsive Web Design)",
          tools: "Chart.js v4, Tailwind CSS, JavaScript ES6+",
          artifacts: "Dashboard_Layout_Mockup.png, Chart_Config_Snippet.js",
          impact: "ผู้บริหารสามารถมองเห็นภาพรวมสมรรถนะและการดำเนินงานได้แบบเรียลไทม์",
          images: curatedOjtPhotos["3-3"]
        },
        {
          id: "3-4",
          date: "พฤหัสบดี 18 ก.ย. 69",
          hours: 4.5,
          task: "ทดสอบความสามารถในการเข้าถึงของระบบตามมาตรฐาน WCAG 2.1 AA",
          skill: "การกำหนด Contrast Ratio และการใช้ Screen Reader",
          blocker: "ปรับแก้ขนาดฟอนต์ให้ชัดเจน",
          steps: "1. ตรวจสอบอัตราส่วนคอนทราสต์สี (Color Contrast Ratio &gt;= 4.5:1)\n2. ทดสอบการนำทางด้วยแป้นพิมพ์ (Keyboard Navigation & Focus Indicator)\n3. ทดสอบร่วมกับโปรแกรมอ่านหน้าจอ (Screen Reader: NVDA / VoiceOver)",
          tools: "WebAIM Contrast Checker, NVDA Screen Reader, Axe DevTools",
          artifacts: "WCAG_Accessibility_Audit.pdf, Contrast_Fix_Report.png",
          impact: "ระบบผ่านเกณฑ์ WCAG 2.1 AA 100% ทำให้ผู้พิการทุกกลุ่มสามารถเข้าถึงรายงานได้อย่างเท่าเทียม",
          images: curatedOjtPhotos["3-4"]
        },
        {
          id: "3-5",
          date: "ศุกร์ 19 ก.ย. 69",
          hours: 4.5,
          task: "ทดสอบระบบร่วมกับผู้ใช้งานและบันทึกข้อเสนอแนะเพื่อปรับปรุง",
          skill: "การทำ User Acceptance Testing (UAT) ภาครัฐ",
          blocker: "ไม่มี",
          steps: "1. เชิญเจ้าหน้าที่ธุรการและไอทีร่วมทดสอบการบันทึก OJT และพิมพ์ใบรายงาน A4\n2. รวบรวมข้อเสนอแนะและบันทึกลงในตาราง UAT Feedback Log\n3. ปรับปรุง UI ให้ใช้งานง่ายขึ้น และสรุปชั่วโมงสะสมครบ 67.5 ชั่วโมง",
          tools: "UAT Test Script, Feedback Form, Google Forms",
          artifacts: "UAT_Signoff_Sheet.pdf, User_Feedback_Log.xlsx",
          impact: "อัตราความพึงพอใจของผู้ใช้งานทดสอบสูงกว่า 95% ระบบพร้อมใช้งานจริง",
          images: curatedOjtPhotos["3-5"]
        }
      ],
      4: [
        {
          id: "4-1",
          date: "จันทร์ 22 ก.ย. 69",
          hours: 4.5,
          task: "วิเคราะห์ข้อมูลสารสนเทศโครงการ ด้วย PivotTable และ Slicer",
          skill: "การจัดหมวดหมู่ข้อมูล การคำนวณ Score Gain และ Performance Level",
          blocker: "การ Clean ข้อมูลชื่อซ้ำซ้อน ดำเนินการแล้ว",
          steps: "1. นำเข้าชุดข้อมูลผู้เรียน Trainee_DB (ชุดข้อมูลโครงการ) และตาราง Ref_Course, Ref_Disability\n2. Clean ข้อมูลซ้ำซ้อนด้วย Remove Duplicates และตัดช่องว่างด้วย TRIM\n3. เขียนสูตร Score Gain = Post_Score - Pre_Score และใช้ XLOOKUP ผูกรหัสหลักสูตร\n4. สร้าง PivotTable และ Slicer วิเคราะห์อัตราได้งานทำ (62.0%) และเงินเดือนเฉลี่ย (18,500 บาท)",
          tools: "=XLOOKUP(A2, Ref_Course!A:A, Ref_Course!B:B)\nScore Gain = (Post_Score - Pre_Score)\nPivotTable Slicers: [Course_Type], [Disability_Type]",
          artifacts: "Trainee_Analytics_1000.xlsx, Score_Gain_Distribution.png, Data_Dictionary.pdf",
          impact: "ช่วยให้ผู้บริหารเห็นผลสัมฤทธิ์ของหลักสูตรได้อย่างชัดเจน นำไปสู่การวางแผนงบประมาณที่คุ้มค่า",
          images: curatedOjtPhotos["4-1"]
        },
        {
          id: "4-2",
          date: "อังคาร 23 ก.ย. 69",
          hours: 4.5,
          task: "ออกแบบและสร้างแดชบอร์ดสรุปสถิติสำหรับผู้บริหาร (Executive Dashboard)",
          skill: "การเชื่อมโยงกราฟแบบโต้ตอบและการนำเสนอข้อมูลเชิงนโยบาย",
          blocker: "ไม่มี",
          steps: "1. วางโครงสร้าง Dashboard ด้วยการ์ด KPI 4 ด้านหลัก\n2. ออกแบบ Donut Chart สรุปสัดส่วนผู้ได้งานทำ และ Bar Chart เปรียบเทียบคะแนน Pre-Post Test\n3. ทดสอบการกรองข้อมูลแบบ Interactive ตามสังกัดและระดับสมรรถนะ",
          tools: "Chart.js, HTML5 Canvas, Tailwind CSS Grid & Flexbox",
          artifacts: "Executive_Dashboard_Final.png, Live_Demo_URL.txt, Dashboard_Source.html",
          impact: "ลดระยะเวลาในการสรุปรายงานประจำปีจาก 3 วัน เหลือเพียง 10 นาทีผ่านแดชบอร์ดอัจฉริยะ",
          images: curatedOjtPhotos["4-2"]
        },
        {
          id: "4-3",
          date: "พุธ 24 ก.ย. 69",
          hours: 4.5,
          task: "วางแผนโครงการและแตกงานย่อยด้วย Project Canvas และ Agile Sprint",
          skill: "การบริหารจัดการงานภาครัฐแบบ Outcome-Based และ RACI Matrix",
          blocker: "ไม่มี",
          steps: "1. สรุปแผนงานโครงการลงใน Project Canvas 9 ช่องหน้าเดียว\n2. กำหนดบทบาทหน้าที่ความรับผิดชอบตาม RACI Matrix (Responsible, Accountable, Consulted, Informed)\n3. จัดทำตาราง Checklist 12 ขั้นตอนตามระเบียบการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ",
          tools: "Project Canvas 9-Boxes, RACI Governance Matrix, Agile Sprint Board",
          artifacts: "Project_Canvas_Gov_2026.pdf, RACI_Matrix_Sheet.xlsx, 12Steps_Checklist.docx",
          impact: "เพิ่มความโปร่งใสในการดำเนินโครงการ และสอดคล้องตามเกณฑ์ PMQA และธรรมาภิบาลภาครัฐ",
          images: curatedOjtPhotos["4-3"]
        },
        {
          id: "4-4",
          date: "พฤหัสบดี 25 ก.ย. 69",
          hours: 4.5,
          task: "ทดสอบความพร้อมของระบบคลังผลงานตามมาตรฐาน WCAG 2.1 AA และ PDPA",
          skill: "การตั้งค่า Contrast Ratio, Alt-Text และการป้องกันข้อมูลส่วนบุคคล",
          blocker: "ปรับแต่งขนาดฟอนต์ให้รองรับผู้มีข้อจำกัด",
          steps: "1. ตรวจสอบโค้ดระบบทั้งหมดตามเกณฑ์ WCAG 2.1 AA (Alt-Text, ARIA Labels, Contrast 4.5:1)\n2. ทดสอบโหมด High Contrast และระบบขยายฟอนต์ 3 ระดับ (A, A+, A++)\n3. เข้ารหัสข้อมูลและจัดเก็บข้อมูลส่วนบุคคลแบบ Local-First เพื่อความปลอดภัยสูงสุด",
          tools: "Accessibility Inspector, PDPA Masking Rule, LocalStorage Encryption",
          artifacts: "Final_Accessibility_Cert.pdf, PDPA_Audit_Log.json, WCAG_Pass_Report.png",
          impact: "เป็นระบบต้นแบบของภาครัฐที่ทุกคนเข้าถึงได้และมีความปลอดภัยของข้อมูลสูงสุด",
          images: curatedOjtPhotos["4-4"]
        },
        {
          id: "4-5",
          date: "ศุกร์ 26 ก.ย. 69",
          hours: 4.5,
          task: "จัดทำรูปเล่มรายงานสมบูรณ์และนำเสนอผลงาน Portfolio ต่อคณะกรรมการ",
          skill: "ทักษะการสื่อสารเชิงวิชาชีพและการนำเสนอผลงานภาครัฐ",
          blocker: "ไม่มี (สำเร็จครบ 90 ชั่วโมง)",
          steps: "1. รวบรวมและตรวจสอบความถูกต้องของสมุดบันทึก OJT ทั้ง 4 สัปดาห์ (ครบถ้วน 90.0 ชม.)\n2. จัดพิมพ์รูปเล่ม Portfolio ประสบการณ์ไอที 13 ปี และเอกสารประกอบการประเมิน\n3. นำเสนอผลสัมฤทธิ์การปฏิบัติงานต่อผู้บังคับบัญชาและคณะกรรมการประเมินผล",
          tools: "Executive Presentation Deck, Smart GovReport Hub 2.5 PDF Exporter",
          artifacts: "OJT_Logbook_Complete_90Hrs.pdf, Digital_Portfolio_Final.pdf, Committee_Signoff.pdf",
          impact: "สำเร็จการฝึกภาคปฏิบัติครบ 90 ชั่วโมงตามเกณฑ์ 100% พร้อมสำหรับการบรรจุจ้างงานภาครัฐ",
          images: curatedOjtPhotos["4-5"]
        }
      ],
      5: [
        {
          id: "5-1",
          date: "จันทร์ 28 ก.ย. 69",
          hours: 4.5,
          task: "นำเสนอรายงานผลสัมฤทธิ์การปฏิบัติงาน OJT และระบบสารสนเทศต้นแบบ",
          skill: "การนำเสนอผลงานและสาธิตการทำงานของระบบ (System Demo)",
          blocker: "ไม่มี",
          steps: "1. นำเสนอการทำงานของระบบบันทึก OJT และ Dashboard อัจฉริยะต่อคณะผู้บริหาร\n2. ตอบข้อซักถามเชิงเทคนิคและการเชื่อมโยงข้อมูลสู่ฐานข้อมูลกลาง\n3. บันทึกข้อเสนอแนะเพื่อนำไปพัฒนาระบบในระยะถัดไป",
          tools: "Projector, Interactive Prototype, System Architecture Diagram",
          artifacts: "Executive_Presentation.pdf, Live_Demo_Recording.mp4",
          impact: "ผู้บริหารและคณะทำงานเห็นชอบและชื่นชมประสิทธิภาพของระบบดิจิทัลต้นแบบ",
          images: curatedOjtPhotos["5-1"]
        },
        {
          id: "5-2",
          date: "อังคาร 29 ก.ย. 69",
          hours: 4.5,
          task: "จัดทำคู่มือการใช้งานระบบ (User Manual) และส่งมอบ Source Code พร้อมเอกสาร",
          skill: "Technical Documentation & Version Control Handover",
          blocker: "ไม่มี",
          steps: "1. จัดทำเอกสารคู่มือผู้ดูแลระบบและผู้ใช้งาน (User Guide & Admin Manual)\n2. รวบรวม Source Code และบันทึกคำสั่งการ Deploy ลงในเอกสารส่งมอบ\n3. ส่งมอบชิ้นงานให้แก่ผู้ควบคุมงานและกลุ่มงานสารสนเทศ",
          tools: "Markdown, GitHub Repository, PDF Generator",
          artifacts: "System_User_Manual.pdf, Source_Code_Handover_Form.pdf",
          impact: "หน่วยงานมีเอกสารคู่มือสมบูรณ์ สามารถนำระบบไปดูแลรักษาและใช้งานต่อได้อย่างราบรื่น",
          images: curatedOjtPhotos["5-2"]
        },
        {
          id: "5-3",
          date: "พุธ 30 ก.ย. 69",
          hours: 4.5,
          task: "ปิดโครงการฝึกภาคปฏิบัติ ประเมินผลสมรรถนะร่วมกับผู้ควบคุมงาน และลงนามรับรอง",
          skill: "Performance Evaluation & Professional Closure",
          blocker: "ไม่มี",
          steps: "1. เข้ารับการประเมินสมรรถนะและรับฟังผลการประเมินจากผู้ควบคุมการฝึกงาน\n2. ตรวจสอบความครบถ้วนของเอกสารและตารางบันทึก OJT ฉบับสมบูรณ์\n3. ลงนามร่วมกับผู้ควบคุมงานในเอกสารรายงานสรุปและแบบรับรองการฝึกปฏิบัติงาน",
          tools: "Competency Evaluation Sheet, Official OJT Signoff Form",
          artifacts: "OJT_Evaluation_Report_Signed.pdf, Certificate_of_Completion.pdf",
          impact: "สำเร็จการฝึกภาคปฏิบัติครบถ้วนตามหลักสูตรอย่างสมบูรณ์แบบ ได้รับการรับรองสมรรถนะครบ 100%",
          images: curatedOjtPhotos["5-3"]
        }
      ]
    };

    // Live In-Memory Working Data
    let liveOjtData = JSON.parse(JSON.stringify(initialOjtWeeklyData));
    let entryToDelete = null;

    // Tab Switching Function
    
    function renderRoleDashboard(role) {
      const traineeDash = document.getElementById('dashboard-trainee-view');
      const supDash = document.getElementById('dashboard-supervisor-view');
      const advDash = document.getElementById('dashboard-advisor-view');
      const staffDash = document.getElementById('dashboard-staff-view');
      const session = getActiveSession();

      // Hide all first
      if (traineeDash) traineeDash.classList.add('hidden');
      if (supDash) supDash.classList.add('hidden');
      if (advDash) advDash.classList.add('hidden');
      if (staffDash) staffDash.classList.add('hidden');

      if (role === 'supervisor') {
        if (supDash) {
          supDash.classList.remove('hidden');
          const greeting = document.getElementById('sup-dash-greeting');
          if (greeting && session) {
            greeting.innerText = `ยินดีต้อนรับ ${session.full_name || 'ผู้ควบคุมงาน'}`;
          }
          updateSupervisorDashboardStats();
        }
      } else if (role === 'advisor') {
        if (advDash) {
          advDash.classList.remove('hidden');
          const greeting = document.getElementById('adv-dash-greeting');
          if (greeting && session) {
            greeting.innerText = `ยินดีต้อนรับ ${session.full_name || 'อาจารย์นิเทศก์'}`;
          }
        }
      } else if (role === 'staff') {
        if (staffDash) {
          staffDash.classList.remove('hidden');
          updateAdminDashboardStats();
        }
      } else {
        // Trainee (default)
        if (traineeDash) traineeDash.classList.remove('hidden');
      }
    }

    function updateSupervisorDashboardStats() {
      const session = getActiveSession();
      const localUsers = getLocalUsers();
      
      // กรองสิทธิ์: หากเป็น Supervisor ให้เห็นเฉพาะเด็กฝึกงานที่ได้รับมอบหมายจริง (1:M Relationship)
      let trainees = localUsers.filter(u => u.role === 'trainee' && u.is_approved);
      if (session && session.role === 'supervisor') {
        const myUsername = String(session.username || '').toLowerCase();
        trainees = trainees.filter(u => String(u.supervisor_username || '').toLowerCase() === myUsername);
      }
      
      const traineesCountEl = document.getElementById('sup-stat-trainees-count');
      if (traineesCountEl) traineesCountEl.innerText = trainees.length;

      // Update pending queue table to match assigned trainees
      const queueTbody = document.getElementById('sup-pending-queue-tbody');
      if (queueTbody) {
        if (trainees.length === 0) {
          queueTbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400"><i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i> ไม่มีรายการงานค้างตรวจ</td></tr>';
        }
      }

      // Render Trainee Cards in Supervisor Roster
      const rosterContainer = document.getElementById('sup-trainee-roster-cards');
      if (rosterContainer) {
        rosterContainer.innerHTML = '';
        if (trainees.length === 0) {
          rosterContainer.innerHTML = `
            <div class="col-span-full py-8 px-4 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                <i class="fa-solid fa-user-clock"></i>
              </div>
              <p class="text-xs font-bold text-slate-700">ยังไม่มีเด็กฝึกงานที่ได้รับมอบหมายในความดูแลของคุณ</p>
              <p class="text-[11px] text-slate-400 mt-1">เจ้าหน้าที่ผู้ดูแลระบบ (Admin ICT) ยังไม่ได้จัดทำหรือมอบหมายเด็กฝึกงานให้สังกัดผู้ควบคุมงานท่านนี้</p>
            </div>
          `;
        } else {
          trainees.forEach(t => {
            const ojtKey = getUserStorageKey(STORAGE_KEYS.OJT_DATA, t.username);
            let tData = null;
            try {
              const raw = localStorage.getItem(ojtKey);
              if (raw) tData = JSON.parse(raw);
              else if (t.username.toLowerCase() === 'trainee_jake') tData = initialOjtWeeklyData;
            } catch(e) {}
            
            let totalHours = 0;
            if (tData) {
              for (let w in tData) {
                if (Array.isArray(tData[w])) {
                  tData[w].forEach(r => { totalHours += (parseFloat(r.hours) || 0); });
                }
              }
            }
            const isComplete = totalHours >= 90;

            const card = document.createElement('div');
            card.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-amber-300 transition';
            card.innerHTML = `
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-xs text-slate-800">${t.full_name || t.username}</span>
                  <span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">Trainee</span>
                  <span class="text-[10px] text-slate-400 font-mono">@${t.username}</span>
                </div>
                <p class="text-[11px] text-slate-500">ความพิการ: ${t.disability_type || 'ทางการเคลื่อนไหวหรือทางร่างกาย'}</p>
                <div class="flex items-center space-x-2 pt-1 text-[11px]">
                  <span class="font-bold text-govTeal">เวลาสะสม: ${totalHours.toFixed(1)} / 90 ชม.</span>
                  ${isComplete ? '<span class="text-emerald-600 font-semibold">✓ ครบเกณฑ์</span>' : '<span class="text-amber-600 font-semibold">⏳ กำลังฝึก</span>'}
                </div>
              </div>
              <button onclick="switchSupervisorViewTrainee('${t.username}'); switchTab('ojt-log');" class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition">
                ดู Logbook
              </button>
            `;
            rosterContainer.appendChild(card);
          });
        }
      }
    }

    function switchSupervisorViewTrainee(targetUsername) {
      const session = getActiveSession();
      if (session && session.role === 'trainee') {
        alert('🚫 ผู้ฝึกงานไม่มีสิทธิ์สลับไปดูข้อมูลของผู้ใช้อื่น');
        return;
      }
      if (session && session.role === 'supervisor') {
        const localUsers = getLocalUsers();
        const myUsername = String(session.username || '').toLowerCase();
        const target = localUsers.find(u => u.username.toLowerCase() === String(targetUsername).toLowerCase());
        if (!target || String(target.supervisor_username || '').toLowerCase() !== myUsername) {
          alert('🚫 ขออภัย คุณไม่มีสิทธิ์เข้าถึงข้อมูลของเด็กฝึกงานที่ไม่ได้อยู่ภายใต้การดูแลของคุณ');
          return;
        }
      }
      currentViewTrainee = targetUsername;
      loadSecurityState();
      loadFromLocalStorage();
      renderProfile();
      renderProjectSummary();
      renderOfficialMemo();
      renderPortfolio();
      changeOjtWeek();
      renderChart();
      updateSupervisorActiveTraineeUI();
    }

    function updateSupervisorActiveTraineeUI() {
      const session = getActiveSession();
      const bar = document.getElementById('sup-trainee-selector-bar');
      const nameEl = document.getElementById('sup-active-trainee-name');
      const selectEl = document.getElementById('sup-trainee-dropdown');
      if (!bar) return;

      if (!session || session.role === 'trainee') {
        bar.classList.add('hidden');
        return;
      }

      // Visible to supervisor, staff, advisor
      bar.classList.remove('hidden');

      const localUsers = getLocalUsers();
      let trainees = localUsers.filter(u => u.role === 'trainee' && u.is_approved);
      if (session.role === 'supervisor') {
        const myUsername = String(session.username || '').toLowerCase();
        trainees = trainees.filter(u => String(u.supervisor_username || '').toLowerCase() === myUsername);
      }

      if (selectEl) {
        selectEl.innerHTML = '';
        if (trainees.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.innerText = '-- ยังไม่มีเด็กในความดูแล --';
          selectEl.appendChild(opt);
          if (nameEl) nameEl.innerText = 'ยังไม่มีเด็กฝึกงานในความดูแล';
          return;
        }

        // หากเด็กฝึกงานที่เลือกปัจจุบันไม่ได้อยู่ในความดูแลของ Supervisor ให้รีเซ็ตเป็นคนแรกที่สังกัด
        if (!trainees.some(t => t.username.toLowerCase() === (currentViewTrainee || '').toLowerCase())) {
          currentViewTrainee = trainees[0].username;
        }

        trainees.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.username;
          opt.innerText = `${t.full_name || t.username} (@${t.username})`;
          if (t.username.toLowerCase() === (currentViewTrainee || '').toLowerCase()) {
            opt.selected = true;
          }
          selectEl.appendChild(opt);
        });
      }

      const activeTraineeObj = trainees.find(t => t.username.toLowerCase() === (currentViewTrainee || '').toLowerCase());
      if (nameEl) {
        nameEl.innerText = activeTraineeObj ? `${activeTraineeObj.full_name} (@${activeTraineeObj.username})` : (currentViewTrainee || '-');
      }
    }

    function updateAdminDashboardStats() {
      const localUsers = getLocalUsers();
      const pendingCount = localUsers.filter(u => u.is_approved !== true).length;
      const countEl = document.getElementById('admin-stat-pending-count');
      const totalEl = document.getElementById('admin-stat-total-users');
      if (countEl) countEl.innerText = pendingCount;
      if (totalEl) totalEl.innerText = localUsers.length;
    }

    // Trainee Action: Submit weekly report
    function submitTraineeWeeklyReport() {
      alert('🚀 ส่งรายงานสัปดาห์ที่ 4 (22.5 ชม.) ไปยังผู้ควบคุมงาน (ผอ.สรินยา) เรียบร้อยแล้ว! สถานะเปลี่ยนเป็น [ส่งแล้ว]');
    }

    // Supervisor Action Modal Handlers
    function openSupervisorReviewModal(weekNum) {
      const modal = document.getElementById('supervisor-review-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeSupervisorReviewModal() {
      const modal = document.getElementById('supervisor-review-modal');
      if (modal) modal.classList.add('hidden');
    }

    function submitSupervisorDecision(decision) {
      closeSupervisorReviewModal();
      const score = document.getElementById('sup-score-input')?.value || 95;
      const comment = document.getElementById('sup-comment-input')?.value || '';
      
      if (decision === 'approve') {
        alert(`🎉 อนุมัติบันทึกเรียบร้อยแล้ว! (คะแนน: ${score}/100)\nข้อคิดเห็น: ${comment}`);
        // Trigger signature modal
        openSignatureModal(4);
      } else {
        alert(`⚠️ ส่งข้อคิดเห็นและตีกลับให้ผู้ฝึกงานแก้ไขเรียบร้อยแล้ว!\nข้อคิดเห็น: ${comment}`);
      }
    }

    // Advisor Actions: Record Supervision Notes & Grade
    function recordSupervisionPrompt() {
      const note = prompt('บันทึกข้อเสนอแนะจากการนิเทศก์งาน:', document.getElementById('advisor-note-display')?.innerText || '');
      if (note) {
        const el = document.getElementById('advisor-note-display');
        if (el) el.innerText = `"${note}"`;
        alert('✅ บันทึกผลการนิเทศก์งานสำเร็จ!');
      }
    }

    function gradeTraineePrompt(traineeUsername) {
      const session = getActiveSession();
      if (session && session.role === 'trainee') {
        alert('🚫 ผู้ฝึกงานไม่มีสิทธิ์ประเมินหรือตัดเกรดสมรรถนะของตนเอง');
        return;
      }
      const grade = prompt('ระบุผลการประเมินตัดเกรดภาพรวม (A, B+, B, C+, C):', 'A');
      if (grade) {
        const badge = document.getElementById(`grade-badge-${traineeUsername}`);
        if (badge) badge.innerText = `ตัดเกรด: ${grade} (สมบูรณ์)`;
        alert(`🎉 บันทึกผลการตัดเกรด [${grade}] สำหรับ [${traineeUsername}] เรียบร้อยแล้ว!`);
      }
    }

    function downloadAllReportsZip() {
      alert('📦 กำลังสร้างแพ็คเกจรายงานรวมทุกหน่วยงาน (A4 Print PDF + Portfolio + Data JSON) กรุณารอสักครู่...');
      setTimeout(() => {
        window.print();
      }, 800);
    }

    function switchTab(tabId) {
      if (tabId === 'executive-overview') {
        const session = (typeof getActiveSession === 'function') ? getActiveSession() : null;
        if (session && session.role === 'trainee') {
          alert('🚫 สิทธิ์ไม่เพียงพอ: หน้ารวมผู้บริหาร (Executive Dashboard) สงวนสิทธิ์เฉพาะผู้ควบคุมงาน อาจารย์นิเทศก์ และเจ้าหน้าที่เท่านั้น');
          switchTab('dashboard');
          return;
        }
      }

      const views = ['dashboard', 'ojt-log', 'project-summary', 'official-memo', 'portfolio-report', 'executive-overview'];
      views.forEach(v => {
        const el = document.getElementById('view-' + v);
        const btn = document.getElementById('btn-tab-' + v);
        if (el) el.classList.add('hidden');
        if (btn) {
          btn.classList.remove('bg-govNavy', 'text-white', 'shadow-sm');
          btn.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
      });

      const activeEl = document.getElementById('view-' + tabId);
      const activeBtn = document.getElementById('btn-tab-' + tabId);
      if (activeEl) activeEl.classList.remove('hidden');
      if (activeBtn) {
        activeBtn.classList.add('bg-govNavy', 'text-white', 'shadow-sm');
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      }

      if (tabId === 'dashboard') {
        renderChart();
        checkAuthGuard();
        updateDashboardKPI();
      } else if (tabId === 'official-memo') {
        renderOfficialMemo();
      } else if (tabId === 'portfolio-report') {
        renderPortfolio();
      } else if (tabId === 'executive-overview') {
        if (typeof renderExecutiveOverview === 'function') renderExecutiveOverview();
      }
    }

    // OJT View Mode Switcher
    let currentOjtViewMode = 'all'; // 'all' (5 pages), 'weekly' (1 page), 'cover' (1 page), 'cover-and-week' (2 pages)
    
    function setOjtView(mode) {
      currentOjtViewMode = mode;
      const btnAll = document.getElementById('ojt-btn-all');
      const btnWeekly = document.getElementById('ojt-btn-weekly');
      const btnCover = document.getElementById('ojt-btn-cover');
      const btnCoverWeek = document.getElementById('ojt-btn-cover-week');

      const inactiveClass = 'px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition';
      const activeClass = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-govNavy text-white shadow-sm transition';

      if (btnAll) btnAll.className = (mode === 'all' ? activeClass : inactiveClass);
      if (btnWeekly) btnWeekly.className = (mode === 'weekly' ? activeClass : inactiveClass);
      if (btnCover) btnCover.className = (mode === 'cover' ? activeClass : inactiveClass);
      if (btnCoverWeek) btnCoverWeek.className = (mode === 'cover-and-week' ? activeClass : inactiveClass);

      renderOjtPages();
    }

    // Render OJT Tables (READ) & Synchronize Week/Date Controls
    function changeOjtWeek() {
      const sel = document.getElementById('ojt-week-select');
      const w = parseInt(sel ? sel.value : 4) || 4;
      updateWeekPillsUI(w);
      updateOjtDaySelectOptions(w);
      renderOjtPages();
    }

    function selectWeekByNum(w) {
      const sel = document.getElementById('ojt-week-select');
      if (sel) {
        sel.value = String(w);
      }
      changeOjtWeek();
    }

    function updateWeekPillsUI(w) {
      [1, 2, 3, 4, 5].forEach(num => {
        const pill = document.getElementById(`pill-week-${num}`);
        if (pill) {
          if (num === w) {
            pill.className = 'px-2 py-1 rounded transition bg-govNavy text-white shadow-2xs font-bold';
          } else {
            pill.className = 'px-2 py-1 rounded transition text-slate-600 hover:bg-slate-100 font-medium';
          }
        }
      });
    }

    function updateOjtDaySelectOptions(weekNum) {
      const daySelect = document.getElementById('ojt-day-select');
      const datePicker = document.getElementById('ojt-custom-datepicker');
      if (!daySelect) return;

      const entries = liveOjtData[weekNum] || [];
      let optHtml = '<option value="all">📅 แสดงทุกวันในสัปดาห์</option>';
      entries.forEach(e => {
        optHtml += `<option value="${e.id}">${e.date} (${e.hours} ชม.)</option>`;
      });
      daySelect.innerHTML = optHtml;

      // Update date picker default value based on week
      if (datePicker) {
        const weekDates = {
          1: '2026-09-01',
          2: '2026-09-07',
          3: '2026-09-14',
          4: '2026-09-21',
          5: '2026-09-28'
        };
        if (weekDates[weekNum]) {
          datePicker.value = weekDates[weekNum];
        }
      }
    }

    function handleOjtDaySelect(val) {
      // Clear previous highlights
      document.querySelectorAll('.ojt-entry-highlight').forEach(el => {
        el.classList.remove('ojt-entry-highlight', 'bg-amber-100', 'ring-2', 'ring-amber-400');
      });

      if (!val || val === 'all') return;

      // Find the row for this entry
      const row = document.getElementById(`ojt-row-${val}`);
      if (row) {
        row.classList.add('ojt-entry-highlight', 'bg-amber-100', 'ring-2', 'ring-amber-400');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function handleCustomDatePicker(dateVal) {
      if (!dateVal) return;
      const parts = dateVal.split('-');
      if (parts.length < 3) return;
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);

      // Map day in September 2026 to week
      let targetWeek = 4;
      if (month === 9) {
        if (day <= 5) targetWeek = 1;
        else if (day <= 12) targetWeek = 2;
        else if (day <= 19) targetWeek = 3;
        else if (day <= 26) targetWeek = 4;
        else targetWeek = 5;
      }

      selectWeekByNum(targetWeek);

      setTimeout(() => {
        const entries = liveOjtData[targetWeek] || [];
        const match = entries.find(e => {
          const dStr = e.date || '';
          return dStr.includes(` ${day} `) || dStr.includes(`${day} ก.ย.`) || dStr.includes(`${day} `);
        });
        if (match) {
          const daySelect = document.getElementById('ojt-day-select');
          if (daySelect) daySelect.value = match.id;
          handleOjtDaySelect(match.id);
        }
      }, 150);
    }

    function quickEditWeekDateRange() {
      const weekSelect = document.getElementById('ojt-week-select');
      const w = parseInt(weekSelect ? weekSelect.value : 4) || 4;
      const curDates = (profileData.curriculum && profileData.curriculum[`w${w}`]?.dates) || '';
      
      const newDates = prompt(`📅 กำหนด/แก้ไขช่วงวันที่สำหรับ สัปดาห์ที่ ${w}:`, curDates || 'เช่น 22 - 26 ก.ย. 69');
      if (newDates !== null && newDates.trim() !== '') {
        if (!profileData.curriculum) profileData.curriculum = {};
        if (!profileData.curriculum[`w${w}`]) profileData.curriculum[`w${w}`] = {};
        profileData.curriculum[`w${w}`].dates = newDates.trim();
        saveToLocalStorage();
        renderProfile();
        changeOjtWeek();
        alert(`✅ อัปเดตช่วงวันที่ของสัปดาห์ที่ ${w} เป็น: "${newDates.trim()}" เรียบร้อยแล้ว`);
      }
    }

    function openEntryNativeDatePicker() {
      const p = document.getElementById('entry-datepicker-hidden');
      if (!p) return;
      if (typeof p.showPicker === 'function') {
        p.showPicker();
      } else {
        p.click();
      }
    }

    const weekWorkdaysSchedule = {
      1: [
        { label: 'จันทร์ 1', full: 'จันทร์ 1 ก.ย. 69' },
        { label: 'อังคาร 2', full: 'อังคาร 2 ก.ย. 69' },
        { label: 'พุธ 3', full: 'พุธ 3 ก.ย. 69' },
        { label: 'พฤหัสฯ 4', full: 'พฤหัสบดี 4 ก.ย. 69' },
        { label: 'ศุกร์ 5', full: 'ศุกร์ 5 ก.ย. 69' }
      ],
      2: [
        { label: 'จันทร์ 7', full: 'จันทร์ 7 ก.ย. 69' },
        { label: 'อังคาร 8', full: 'อังคาร 8 ก.ย. 69' },
        { label: 'พุธ 9', full: 'พุธ 9 ก.ย. 69' },
        { label: 'พฤหัสฯ 10', full: 'พฤหัสบดี 10 ก.ย. 69' },
        { label: 'ศุกร์ 11', full: 'ศุกร์ 11 ก.ย. 69' }
      ],
      3: [
        { label: 'จันทร์ 14', full: 'จันทร์ 14 ก.ย. 69' },
        { label: 'อังคาร 15', full: 'อังคาร 15 ก.ย. 69' },
        { label: 'พุธ 16', full: 'พุธ 16 ก.ย. 69' },
        { label: 'พฤหัสฯ 17', full: 'พฤหัสบดี 17 ก.ย. 69' },
        { label: 'ศุกร์ 18', full: 'ศุกร์ 18 ก.ย. 69' }
      ],
      4: [
        { label: 'จันทร์ 21', full: 'จันทร์ 21 ก.ย. 69' },
        { label: 'อังคาร 22', full: 'อังคาร 22 ก.ย. 69' },
        { label: 'พุธ 23', full: 'พุธ 23 ก.ย. 69' },
        { label: 'พฤหัสฯ 24', full: 'พฤหัสบดี 24 ก.ย. 69' },
        { label: 'ศุกร์ 25', full: 'ศุกร์ 25 ก.ย. 69' }
      ],
      5: [
        { label: 'จันทร์ 28', full: 'จันทร์ 28 ก.ย. 69' },
        { label: 'อังคาร 29', full: 'อังคาร 29 ก.ย. 69' },
        { label: 'พุธ 30', full: 'พุธ 30 ก.ย. 69' }
      ]
    };

    function renderModalWorkdayPills(weekNum, activeDateStr = '') {
      const container = document.getElementById('modal-workday-pills');
      if (!container) return;
      const days = weekWorkdaysSchedule[weekNum] || weekWorkdaysSchedule[4];
      const curVal = (activeDateStr || (document.getElementById('entry-date')?.value || '')).trim();

      // Dynamic grid columns: 3 columns for week 5 (3 days), 5 columns for weeks 1-4
      container.className = (days.length === 3) ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-5 gap-1.5';

      container.innerHTML = days.map(d => {
        const isActive = curVal === d.full || curVal.startsWith(d.label) || curVal.includes(d.label);
        const activeClass = 'bg-govNavy text-white font-bold shadow-xs border-govNavy py-2 text-center';
        const inactiveClass = 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border-slate-300 py-2 text-center';
        return `<button type="button" onclick="selectModalWorkday('${d.full}')" class="px-1 rounded-xl text-xs border transition shadow-2xs ${isActive ? activeClass : inactiveClass}">${d.label}</button>`;
      }).join('');

      const labelEl = document.getElementById('modal-selected-day-label');
      if (labelEl) {
        labelEl.innerText = curVal ? `เลือก: ${curVal}` : '';
      }
    }

    function selectModalWorkday(fullDateStr) {
      const input = document.getElementById('entry-date');
      if (input) input.value = fullDateStr;
      const targetWeek = parseInt(document.getElementById('entry-target-week')?.value || '4', 10);
      renderModalWorkdayPills(targetWeek, fullDateStr);
    }

    function highlightMatchingModalDayPill() {
      const targetWeek = parseInt(document.getElementById('entry-target-week')?.value || '4', 10);
      const curVal = document.getElementById('entry-date')?.value || '';
      renderModalWorkdayPills(targetWeek, curVal);
    }

    function applyEntryDateFromPicker(val) {
      if (!val) return;
      const parts = val.split('-');
      if (parts.length < 3) return;
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);

      let targetWeek = 4;
      if (month === 9) {
        if (day <= 5) targetWeek = 1;
        else if (day <= 12) targetWeek = 2;
        else if (day <= 19) targetWeek = 3;
        else if (day <= 26) targetWeek = 4;
        else targetWeek = 5;
      }

      const weekElem = document.getElementById('entry-target-week');
      if (weekElem) weekElem.value = String(targetWeek);
      const titleElem = document.getElementById('crud-modal-title');
      if (titleElem) titleElem.innerText = `เพิ่มบันทึกการปฏิบัติงาน (สัปดาห์ที่ ${targetWeek})`;

      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const dayName = dayNames[d.getDay()];
      const mStr = 'ก.ย.';
      const yr = '69';
      
      const dateStr = `${dayName} ${day} ${mStr} ${yr}`;
      const input = document.getElementById('entry-date');
      if (input) input.value = dateStr;

      renderModalWorkdayPills(targetWeek, dateStr);
    }

