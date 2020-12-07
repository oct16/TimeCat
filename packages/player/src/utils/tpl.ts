export const emptyTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0,user-scalable=no, viewport-fit=cover">
    <meta http-equiv="Content-Security-Policy-Report-Only" />
    <title>TimeCat</title>
</head>
<body style="margin: 0">
</body>
</html>
`
export const pacmanCss = `.pacman-box{margin:0 auto;display:flex;vertical-align:middle;height:100vh;flex:0 1 auto;flex-direction:column;flex-grow:1;flex-shrink:0;flex-basis:25%;max-width:25%;align-items:center;justify-content:center}.pacman>div:first-of-type,.pacman>div:nth-child(2){width:0;height:0;border-right:25px solid transparent;border-top:25px solid grey;border-left:25px solid grey;border-bottom:25px solid grey;border-radius:25px;position:relative;left:-30px}@-webkit-keyframes rotate_pacman_half_up{0%,100%{-webkit-transform:rotate(270deg);transform:rotate(270deg)}50%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes rotate_pacman_half_up{0%,100%{-webkit-transform:rotate(270deg);transform:rotate(270deg)}50%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@-webkit-keyframes rotate_pacman_half_down{0%,100%{-webkit-transform:rotate(90deg);transform:rotate(90deg)}50%{-webkit-transform:rotate(0);transform:rotate(0)}}@keyframes rotate_pacman_half_down{0%,100%{-webkit-transform:rotate(90deg);transform:rotate(90deg)}50%{-webkit-transform:rotate(0);transform:rotate(0)}}@-webkit-keyframes pacman-balls{75%{opacity:.7}100%{-webkit-transform:translate(-100px,-6.25px);transform:translate(-100px,-6.25px)}}@keyframes pacman-balls{75%{opacity:.7}100%{-webkit-transform:translate(-100px,-6.25px);transform:translate(-100px,-6.25px)}}.pacman{transform: translateX(30px);position:relative}.pacman>div:nth-child(3){-webkit-animation:pacman-balls 1s -.66s infinite linear;animation:pacman-balls 1s -.66s infinite linear}.pacman>div:nth-child(4){-webkit-animation:pacman-balls 1s -.33s infinite linear;animation:pacman-balls 1s -.33s infinite linear}.pacman>div:nth-child(5){-webkit-animation:pacman-balls 1s 0s infinite linear;animation:pacman-balls 1s 0s infinite linear}.pacman>div:first-of-type{-webkit-animation:rotate_pacman_half_up .5s 0s infinite;animation:rotate_pacman_half_up .5s 0s infinite}.pacman>div:nth-child(2){-webkit-animation:rotate_pacman_half_down .5s 0s infinite;animation:rotate_pacman_half_down .5s 0s infinite;margin-top:-50px}.pacman>div:nth-child(3),.pacman>div:nth-child(4),.pacman>div:nth-child(5),.pacman>div:nth-child(6){background-color:grey;border-radius:100%;margin:2px;width:10px;height:10px;position:absolute;-webkit-transform:translate(0,-6.25px);transform:translate(0,-6.25px);top:25px;left:70px}`

export const loadingScriptContent = `const loadingNode = document.createElement('div')
loadingNode.className = 'pacman-box';
loadingNode.innerHTML = '<style>${pacmanCss}<\/style><div class="pacman"><div><\/div><div><\/div><div><\/div><div><\/div><div><\/div><\/div>'
loadingNode.setAttribute('style', 'text-align: center;vertical-align: middle;line-height: 100vh;')
document.body.insertBefore(loadingNode, document.body.firstChild);window.addEventListener('DOMContentLoaded', () => loadingNode.parentNode.removeChild(loadingNode))`

const ringCss = `.lds-ring{margin-left:-40px;margin-top:-40px;width:80px;height:80px;position:absolute;left:50%;top:50%}.lds-ring div{box-sizing:border-box;display:block;position:absolute;width:64px;height:64px;margin:8px;border:8px solid grey;border-radius:50%;animation:lds-ring 1.2s cubic-bezier(0.5,0,0.5,1) infinite;border-color:grey transparent transparent transparent}.lds-ring div:nth-child(1){animation-delay:-0.45s}.lds-ring div:nth-child(2){animation-delay:-0.3s}.lds-ring div:nth-child(3){animation-delay:-0.15s}@keyframes lds-ring{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`
export const normalLoading = `<div class="lds-ring"><style>${ringCss}<\/style><div></div><div></div><div></div><div></div></div>`
