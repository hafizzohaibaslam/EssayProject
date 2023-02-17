$(function () {
    $('#content_textarea').keydown(function (e) {
        if (e.ctrlKey && e.keyCode == 13) {
            // Ctrl-Enter pressed
            console.log('pressed==========')
            var text = $('#content_textarea').val();
            var cursorPosition = $('#content_textarea').prop("selectionStart");
            text = text.substring(0, cursorPosition); 
            var textArray = text.split('\n');

            // console.log(textArray, 'xxx');
            var queryText = textArray[textArray.length - 1];
            console.log(queryText);
            
            //collect the 
            var writing_sections = [];
            console.log()
            if ($('#abstract').is(':checked')) writing_sections.push('abstract');
            if ($('#introduction').is(':checked')) writing_sections.push('introduction');
            if ($('#relatedwork').is(':checked')) writing_sections.push('relatedwork');
            if ($('#modelling').is(':checked')) writing_sections.push('modelling');
            if ($('#experiment').is(':checked')) writing_sections.push('experiment');
            if ($('#conclusion').is(':checked')) writing_sections.push('conclusion');
            if ($('#acknowledgment').is(':checked')) writing_sections.push('acknowledgment');

            //send the query to the backend
            awesomeQuery(queryText, writing_sections);
        }
    });

});

function awesomeQuery(queryText, writing_sections) {
    var params = {
        doc_index: $("#researchIndexDDL").val(),
        user_query: queryText,
        writing_sections: writing_sections,
    };
    $.post('/api/suggestParagraphs', params, function (data) {
        // console.log(data.hits.hits);
        console.log(data);
        var html = '';
        data.hits.hits.forEach((div) => {
            html += constructDiv(div);
        });
        $('#results_div').html(html);
    });
}


function constructDiv(hit) {
    if (hit.highlight === undefined) return '';
    var div = '<div>';
    div += `<p class=essay-title>[${hit._source.doc_type}] ${hit._source.from_paper}</p>`;
    hit.highlight['text'].forEach(sentence => {
        div += `<p>${sentence}</p>`
    });
    div += '</div>'
    return div;
}
