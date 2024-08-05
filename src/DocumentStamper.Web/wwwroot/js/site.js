// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

import * as pdfjsLib from 'https://mozilla.github.io/pdf.js/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';

var ns = 'http://www.w3.org/2000/svg'

//правка от 02.08.2024 добавить алерт для любой даты, кроме сегодня
document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("dateInput");

    dateInput.addEventListener("change", function () {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();

        if (selectedDate.getFullYear() !== today.getFullYear() ||
            selectedDate.getMonth() !== today.getMonth() ||
            selectedDate.getDate() !== today.getDate()) {
            alert("Не сегодня!");
        }
    });
});

document.addEventListener("DOMContentLoaded", function ()
{

    var fileInput = document.getElementById("fileInput");
    const reader = new FileReader();

    fileInput.addEventListener("change", function (event) {
        var file = event.target.files[0];

        if (file.type !== "application/pdf" || !file.name.endsWith(".pdf")) {
            console.log("Not a PDF");
            alert("Пожалуйста, загрузите файл формата PDF.");
            fileInput.value = "";
        } else {
            reader.onload = function (e) {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const signature = String.fromCharCode(...uint8Array.subarray(0, 5));
                if (signature !== '%PDF-') {
                    alert("Файл PDF повреждён.");
                } else {
                    displayPDF(arrayBuffer);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    });

    async function displayPDF(arrayBuffer) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;


        //var draw = SVG().addTo('#stamp-content');
        //var image = draw.image('/svg/StampBWUst.svg').size(200, 100);

        console.log('PDF loaded');

        const canvas = document.getElementById('the-canvas');
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        await renderPdf(canvas, pdf);

        canvas.addEventListener('mousedown', async function (e) {
            await renderPdf(canvas, pdf);
            setStampPreview(canvas, e);
        });
    }

    async function renderPdf(canvas, pdf, pageNumber = 1) {
        const page = await pdf.getPage(pageNumber);

        //TODO: clear canvas image

        const container = document.getElementById('canvas-container');
        const containerWidth = container.clientWidth;

        let viewport = page.getViewport({ scale: 1.5 });

        //const scale = containerWidth / viewport.width;
        //viewport = page.getViewport({ scale: scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered');
    }

    function setStampPreview(canvas, event) {
        const dateInput = document.getElementById("dateInput").value;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        console.log("x: " + x + " y: " + y);

        window.coordinates = { x: x, y: y };

        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.rect(x, y, 10, 10);
        ctx.stroke();


        return;

        var img = new Image();
        

        img.width = 50;
        img.onload = function () {
            ctx.drawImage(img, x, y, 100, 50);
        }
        
        img.src = "/svg/StampBWUst.svg";
        

    }

    function submitForm(event) {
        event.preventDefault();

        const dateInput = document.getElementById('dateInput');
        const numberInput = document.getElementById('numberInput');

        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onloadend = function () {
            const data = {
                date: dateInput.value,
                number: numberInput.value,
                coordinates: window.coordinates,
                file: reader.result.split(',')[1],
                fileType: file.type,
                fileName: file.name
            };
            const jsonData = JSON.stringify(data);
            console.log(jsonData);
        };

        reader.readAsDataURL(file);
    }

    const form = document.getElementById('form');
    form.addEventListener('submit', submitForm);
});
