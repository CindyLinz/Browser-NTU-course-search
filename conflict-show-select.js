let myschedule = [];
let page_id;

function doUpdate(){
    let all_show = true, all_hide = true;
    myschedule.forEach(c => {
      if( c.hide ){
        all_show = false;
        document.querySelector(`[name=c${c.序號}][value=hide]`).checked = true;
      }
      else{
        all_hide = false;
        document.querySelector(`[name=c${c.序號}][value=show]`).checked = true;
      }
    });
    document.querySelector('[name=c-show]').checked = all_show;
    document.querySelector('[name=c-hide]').checked = all_hide;
    chrome.runtime.sendMessage({
        type: 'conflict-show-select',
        page_id: page_id,
        data: myschedule,
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    page_id = urlParams.get('page_id');
    myschedule = JSON.parse(urlParams.get('myschedule'));
    const contentElement = document.getElementById('content');
    let html = '<table><tr><th><label><input type=checkbox name=c-show>顯示</label><th><label><input type=checkbox name=c-hide>隱藏</label><th>課程';
    myschedule.forEach(c => {
      html += `<tr><td><input type=radio value=show name=c${c.序號}><td><input value=hide type=radio name=c${c.序號}><td>${c.序號}. ${c.流水號} ${c.課號} ${c.課程名稱} ${c.授課教師} ${c.時間教室}`;
    });
    html += '</table>';
    contentElement.innerHTML = html;
    doUpdate();
});

document.addEventListener('click', (e) => {
    if( e.target.matches('[name=c-show]') ){
        e.stopPropagation();
        let hide = !e.target.checked;
        myschedule.forEach(elem => elem.hide = hide);
        doUpdate();
    }
    if( e.target.matches('[name=c-hide]') ){
        e.stopPropagation();
        let hide = e.target.checked;
        myschedule.forEach(elem => elem.hide = hide);
        doUpdate();
    }
    if( e.target.matches('[type=radio]') ){
        e.stopPropagation();
        let seq = e.target.name.match(/\d+/)[0];
        myschedule[seq-1].hide = e.target.value==='hide';
        doUpdate();
    }
    if( e.target.id==='close-btn' ){
        e.stopPropagation();
        window.close();
    }
});
