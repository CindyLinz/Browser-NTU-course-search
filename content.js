function parseSlot(slotString) {
    slotString = slotString.replace(/\(.*?\)/g, '').replace(/.*?(?=[日一二三四五六])/, '');
    let slots = {};
    slotString.replace(/([日一二三四五六])(.*?)(?=$|[日一二三四五六])/g, function($0, $1, $2){
      slots[$1] = {};
      $2.replace(/10|[0-9A-D]/g, function(s){
        slots[$1][s] = 1;
      });
    });
    return slots;
}

function isSlotConflict(a, b){
    for(dayA in a){
        if(dayA in b){
            let tAs = a[dayA];
            for(tB in b[dayA])
                if(tAs[tB])
                    return true;
        }
    }
    return false;
}

function htmlEncode(str){
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractCourseFieldIndex(table){
    let index = {};
    let headerTds = table.querySelector('tr').querySelectorAll('td');
    ['流水號', '課號', '課程名稱', '授課教師', '時間教室'].forEach(field => {
        headerTds.forEach((td, i) => {
            if( td.textContent.trim() == field )
                index[field] = i+1;
        });
    });
    return index;
}

function extractCourseData(table){
    const index = extractCourseFieldIndex(table);
    const courses = [];
    
    const rows = table.querySelectorAll('tr');
    
    for (let i = 1; i < rows.length - 1; i++) {
        const row = rows[i];
        
        let seq = row.querySelector(`td:nth-of-type(${index.流水號})`).textContent.trim();
        if (seq.match(/^\d+$/)) {
            let courseData = {};
            for(field in index){
                courseData[field] = row.querySelector(`td:nth-of-type(${index[field]})`).textContent.trim();
            };
            courseData.slots = parseSlot(courseData.時間教室);
            courses.push(courseData);
        }
    }
    
    return courses;
}

function toggleConflict(show){
    const tables = document.querySelectorAll('table');

    for (let table of tables) {
        if (table.querySelector('table')) continue;
        const firstRow = table.querySelector('tr');
        if (firstRow && firstRow.innerText.includes('流水號')) {
            const allRows = table.querySelectorAll('tr');

            allRows.forEach((row, index) => {
                let stat = row.querySelector('td:nth-of-type(1)').innerText;
                if( stat.match(/衝堂/) && !stat.match(/已選/) ){
                    if( show )
                        row.style.display = '';
                    else
                        row.style.display = 'none';
                }
            });
        }
    }
}

function addEmptyColumnToFirstTable(chosen) {
    const tables = document.querySelectorAll('table');

    for (let table of tables) {
        if (table.querySelector('table')) continue;
        const firstRow = table.querySelector('tr');
        if (firstRow && firstRow.innerText.includes('流水號')) {
            const indexes = extractCourseFieldIndex(table);
            if( !('流水號' in indexes) )
                continue;

            const allRows = table.querySelectorAll('tr');

            allRows.forEach((row, index) => {
                const newCell = document.createElement(index === 0 ? 'th' : 'td');
                let content = '';

                let seq = row.querySelector(`td:nth-of-type(${indexes.流水號})`).textContent.trim();
                if( !seq.match(/^\d+$/) ){
                    if( index==0 ){
                        content += '衝堂<br><label style=white-space:nowrap><input type=radio name=conflict-toggle value=show checked> 顯示</label><br><label style=white-space:nowrap><input type=radio name=conflict-toggle value=hide> 隱藏</label>';
                    }
                }
                else{
                    let slots = parseSlot(row.querySelector(`td:nth-of-type(${indexes.時間教室})`).textContent.trim());

                    chosen.forEach(c => {
                        if( c.流水號 == seq ){
                            content += '<div class="course-helper-label chosen">已選</div>';
                        }
                        else{
                            if( isSlotConflict(slots, c.slots) )
                                content += `<div class="course-helper-label conflict" title="${c.流水號} ${c.課號} ${htmlEncode(c.課程名稱)} ${htmlEncode(c.授課教師)}">衝堂</div>`;
                        }
                    });

                }

                if( content==='' ) content += '&nbsp;';
                newCell.innerHTML = content;

                if (index === 0) {
                    newCell.style.backgroundColor = '#DDEDFF';
                    newCell.style.textAlign = 'center';
                    newCell.style.height = '25px';
                }

                row.insertBefore(newCell, row.firstChild);
            });

            break;
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.matches('input[name="conflict-toggle"]')) {
            toggleConflict(e.target.value === 'show' ? 1 : 0);
        }
    });
}

function fetchMySchedulePage() {
    return fetch('https://nol.ntu.edu.tw/nol/coursesearch/myschedule.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .catch(error => {
        console.error('Error fetching myschedule.php:', error);
        throw error;
    });
}

function parseMySchedule(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const table = doc.querySelector('table[align="CENTER"]');
    if (!table) return courses;
    
    return extractCourseData(table);
}

function process() {
    fetchMySchedulePage().then(html => {
        let schedule = parseMySchedule(html);
        console.log(schedule);
        addEmptyColumnToFirstTable(schedule);
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', process);
} else {
    process();
}

