function showPage(content) {
    console.log(content);
    switch (content) {
        case 'admin':
            window.open(
                'dashboard.html',
                '_blank'
            );
            break;
        case 'about_us':
            window.open(
                'http://cbastrategicit.com/',
                '_blank'
            );
            break;
        case 'power_x':
            window.open(
                'writing.html',
                '_blank'
            );
            break;
        case 'instructions':
            window.open(
                '../documents/user_manual.pdf',
                '_blank'
            );
            break;
        case 'virtual_agent':
            window.open(
                'chatbot.html',
                '_blank'
            );
            break;
        case 'apis':
            window.open(
                'docs.html',
                '_blank'
            );
            break;


        case 'demos':
            window.open(
                'demos.html',
                '_blank'
            );
            break;

        case 'CBA_KBP':
            window.open(
                'cbakbp.html',
                '_blank'
            );
            break;
        case 'insight_engine':
            window.open(
                'login.html',
                '_blank'
            );
            break;
        case 'classroom_app':
            window.open(
                'https://drive.google.com/open?id=0B9UbzKGj1AiYa2ZVR29lMEhCZlk',
                '_blank'
            );
            break;
        case 'lecturer_app':
            window.open(
                'https://drive.google.com/open?id=0B9UbzKGj1AiYam9pS3VfNXgwQVU',
                '_blank'
            );
            break;
        case 'student_app':
            window.open(
                'https://drive.google.com/open?id=0B9UbzKGj1AiYUTd5Q25ieFFBNHc',
                '_blank'
            );
            break;
        case 'test':
            window.open(
                '../test_page6.html',
                '_blank'
            );
            break;
        default:
            window.open(
                'dashboard.html',
                '_blank'
            );
    }

}