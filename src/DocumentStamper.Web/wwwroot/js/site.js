// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

import * as pdfjsLib from 'https://mozilla.github.io/pdf.js/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';

var ns = 'http://www.w3.org/2000/svg'

window.stamperState = window.stamperState ?? {};

//правка от 02.08.2024 добавить алерт для любой даты, кроме сегодня
document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("dateInput");

    dateInput.addEventListener("change", function () {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();

        if (selectedDate.getFullYear() !== today.getFullYear() ||
            selectedDate.getMonth() !== today.getMonth() ||
            selectedDate.getDate() !== today.getDate()) {

            // create new div with error message and toggle class to change visibility
            alert("Не сегодня!");
        }
    });
});

document.addEventListener("DOMContentLoaded", function ()
{

    var fileInput = document.getElementById("fileInput");

    fileInput.addEventListener("change", async function (event) {
        var file = event.target.files[0];

        if (file.type !== "application/pdf" || !file.name.endsWith(".pdf")) {
            console.log("Not a PDF");
            alert("Пожалуйста, загрузите файл формата PDF.");
            fileInput.value = "";
        } else {
            const arrayBuffer = await ReadFileAsync(reader => reader.readAsArrayBuffer(file));
            const uint8Array = new Uint8Array(arrayBuffer);
            const signature = String.fromCharCode(...uint8Array.subarray(0, 5));
            if (signature !== '%PDF-') {
                alert("Файл PDF повреждён.");
                return;
            }

            try {
                await displayPDF(arrayBuffer);
            } catch (e) {
                if (!(e instanceof pdfjsLib.InvalidPDFException))
                    throw e;

                // TODO #5 process rendering errors with user-friendly error messages
                alert("Файл PDF повреждён: " + e);
            }
        }
    });

    function ReadFileAsync(readerAction) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            readerAction(reader);
        });
    }

    async function displayPDF(arrayBuffer) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;


        //var draw = SVG().addTo('#stamp-content');
        //var image = draw.image('/svg/StampBWUst.svg').size(200, 100);

        console.log('PDF loaded');

        const canvas = document.getElementById('the-canvas');

        if (window.stamperState.listener)
            canvas.removeEventListener('mousedown', window.stamperState.listener);

        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        // TODO clear selected coordinates

        await renderPdf(canvas, pdf);

        const listener = async function (e) {
            await renderPdf(canvas, pdf);
            setStampPreview(canvas, e);
        }
        canvas.addEventListener('mousedown', listener);
        window.stamperState.listener = listener;
    }

    async function renderPdf(canvas, pdf, pageNumber = 1) {
        const page = await pdf.getPage(pageNumber);
        let viewport = page.getViewport({ scale: 1 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered');

        // TODO #9 ensure rendering is awaited to completion before exiting the function!!! important
        await setTimeout(() => console.log('Page rendered... most likely =('), 100);
    }

    function setStampPreview(canvas, event) {
        // TODO #10 add date preview on csv stamp image
        const dateInput = document.getElementById("dateInput").value;

        const stampW = 200;
        const stampH = 100;

        const rect = canvas.getBoundingClientRect();

        var scale = canvas.width / canvas.clientWidth;

        // TODO refactor: calculating coordinates for stamp not to get out of canvas bounds
        let x = (event.clientX - rect.left) * scale;
        let y = (event.clientY - rect.top) * scale;

        x = x - stampW / 2 < 0 ? stampW / 2 : x;
        y = y - stampH / 2 < 0 ? stampH / 2 : y;

        x = x + stampW / 2 > canvas.width ? canvas.width - stampW / 2 : x;
        y = y + stampH / 2 > canvas.heigth ? canvas.heigth - stampH / 2 : y;

        console.log("x: " + x + " y: " + y);

        window.stamperState.coordinates = { x: x - stampW / 2, y: y - stampH / 2 };

        const ctx = canvas.getContext('2d');

        var img = new Image();

        img.width = 50;
        img.onload = function () {
            ctx.drawImage(img, x - stampW / 2, y - stampH / 2, stampW, stampH);
        }
        
        img.src = "/svg/StampBWUst.svg";
        

    }

    async function submitForm(event) {
        event.preventDefault();

        const dateInput = document.getElementById('dateInput');
        const numberInput = document.getElementById('numberInput');

        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        const encodedFile = await ReadFileAsync(reader => reader.readAsDataURL(file));

        const data = {
            date: dateInput.value,
            number: numberInput.value,
            coordinates: window.stamperState?.coordinates,
            file: encodedFile.split(',')[1],
            fileType: file.type,
            fileName: file.name
        };
        const jsonData = JSON.stringify(data);
        console.log(jsonData);
    }

    const form = document.getElementById('form');
    form.addEventListener('submit', submitForm);
});
