export const assignmentDocuments = [
  {
    file: "CSCB532_Kostadinova_Logistic_Company.pdf",
    title: {
      bg: `Приложение „Логистична компания“`,
      en: `Application "Logistics Company"`,
    },
    sections: [
      {
        title: { bg: "Задание", en: "Assignment" },
        paragraphs: [
          {
            bg: `Да се реализира уеб приложение „Логистична компания“, което да служи за управление на процесите в логистична компания.`,
            en: `Implement a web application "Logistics Company" for managing processes in a logistics company.`,
          },
          {
            bg: "Основната дейност на компанията е да осъществява услуги по приемане и доставяне на пратки. Компанията разполага с офиси на различни места и в нея работят два вида служители: куриери, които извършват доставката на пратките, и офис-служители, които обслужват клиенти в офисите на компанията.",
            en: "The company's main activity is accepting and delivering shipments. It operates offices in various locations and employs two types of staff: couriers who deliver shipments, and office employees who serve clients at company offices.",
          },
          {
            bg: "Клиентите изпращат и/или получават пратки от офисите на компанията или от друг адрес. Пратките имат подател, получател, адрес за доставка и тегло. Цената зависи от теглото и дали доставката е до офис или до точен адрес. Доставките до офис са по-евтини от тези до адрес.",
            en: "Clients send and/or receive shipments from company offices or from another address. Shipments have a sender, receiver, delivery address, and weight. The price depends on weight and whether delivery is to an office or a specific address. Office deliveries are cheaper than address deliveries.",
          },
          {
            bg: "Служителите могат да виждат всички регистрирани пратки. Всеки клиент може да вижда само пратките, които е изпратил, получил или очаква да получи.",
            en: "Employees can view all registered shipments. Each client can only view shipments they sent, received, or are expecting to receive.",
          },
        ],
      },
      {
        title: { bg: "Функционални изисквания", en: "Functional requirements" },
        items: [
          { bg: "Регистриране на потребители и вход в системата.", en: "User registration and system login." },
          { bg: "Възможност за задаване на роли на потребителите: служител и клиент.", en: "Ability to assign user roles: employee and client." },
          { bg: "Въвеждане, показване, редактиране и изтриване на данни за логистична компания, служител, клиент, офис и пратка.", en: "Create, view, edit, and delete data for a logistics company, employee, client, office, and shipment." },
          { bg: "Служителите трябва да могат да регистрират изпратените и получените пратки.", en: "Employees must be able to register sent and received shipments." },
          { bg: "Всеки служител може да вижда всички пратки.", en: "Every employee can view all shipments." },
          { bg: "Всеки клиент може да вижда пратките, които е изпратил или получил.", en: "Every client can view shipments they sent or received." },
        ],
      },
      {
        title: { bg: "Справки", en: "Reports" },
        items: [
          { bg: "Всички служители в компанията.", en: "All employees in the company." },
          { bg: "Всички клиенти на компанията.", en: "All clients of the company." },
          { bg: "Всички пратки, които са били регистрирани.", en: "All registered shipments." },
          { bg: "Всички пратки, които са регистрирани от даден служител.", en: "All shipments registered by a given employee." },
          { bg: "Всички пратки, които са изпратени, но не са получени.", en: "All shipments that have been sent but not yet received." },
          { bg: "Всички пратки, които са изпратени от даден клиент.", en: "All shipments sent by a given client." },
          { bg: "Всички пратки, които са получени от даден клиент.", en: "All shipments received by a given client." },
          { bg: "Всички приходи на фирмата за определен период от време.", en: "All company revenue for a given period of time." },
        ],
      },
      {
        title: { bg: "Технологични изисквания", en: "Technical requirements" },
        paragraphs: [
          {
            bg: "Приложението трябва да бъде уеб базирано и да се визуализира в популярни браузери като Chrome, Mozilla Firefox и Internet Explorer.",
            en: "The application must be web-based and render correctly in popular browsers such as Chrome, Mozilla Firefox, and Internet Explorer.",
          },
          {
            bg: "Дизайнът трябва да бъде респонсив и подходящ за мобилни устройства.",
            en: "The design must be responsive and suitable for mobile devices.",
          },
          {
            bg: "Разработената система трябва да се състои от код, база данни и документация. Кодът трябва да включва подробни коментари.",
            en: "The developed system must consist of code, a database, and documentation. The code must include detailed comments.",
          },
          {
            bg: "Документацията трябва да описва функционалностите на системата и да включва екрани, на които ясно се вижда коя част от програмата за какво се използва.",
            en: "The documentation must describe the system's functionality and include screenshots clearly showing what each part of the program is used for.",
          },
          {
            bg: "Необходимо е да се посочат задачите, изпълнени от всеки участник в екипа.",
            en: "The tasks completed by each team member must be listed.",
          },
        ],
      },
      {
        title: { bg: "Оценяване", en: "Grading" },
        items: [
          { bg: "Степен на изпълнение на задачите, поставени в заданието.", en: "Degree of completion of the assigned tasks." },
          { bg: "Качество на изпълнение на реализираните функционалности.", en: "Quality of implementation of the realized functionalities." },
          { bg: "Индивидуален принос на всеки участник.", en: "Individual contribution of each team member." },
          { bg: "61-70%: Среден 3.", en: "61-70%: Satisfactory (3)." },
          { bg: "71-80%: Добър 4.", en: "71-80%: Good (4)." },
          { bg: "81-90%: Мн. добър 5.", en: "81-90%: Very good (5)." },
          { bg: "91-100%: Отличен 6.", en: "91-100%: Excellent (6)." },
        ],
      },
      {
        title: { bg: "Консултант", en: "Consultant" },
        paragraphs: [
          {
            bg: "гл. ас. д-р Христина Костадинова, hkostadinova@gmail.com, hkostadinova@nbu.bg",
            en: "Assoc. Prof. Dr. Hristina Kostadinova, hkostadinova@gmail.com, hkostadinova@nbu.bg",
          },
        ],
      },
    ],
  },
];
