openTab = (evt, tabName) => {
    let i; let x; let tablinks
    for (i = 0; i < $('.content-tab').length; i++) {
        $('.content-tab')[i].style.display = 'none'
    }
    for (i = 0; i < $('.content-tab').length; i++) {
        $('.tab')[i].className = $('.tab')[i].className.replace(' is-active', '')
    }
    document.getElementById(tabName).style.display = 'block'
    evt.currentTarget.className += ' is-active'
}
