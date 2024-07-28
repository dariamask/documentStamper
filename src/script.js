document.addEventListener("DOMContentLoaded", function () {
    var fileInput = document.getElementById("fileInput");

    fileInput.addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (file.type === "application/pdf") {
            var reader = new FileReader();
            reader.onload = function (e) {
                var arrayBuffer = e.target.result;
                displayPDF(arrayBuffer);
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.log("Please upload a PDF file.");
        }
    });

    async function displayPDF(arrayBuffer) {
        var { pdfjsLib } = globalThis;

        pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('PDF loaded');

        var canvas = document.getElementById('the-canvas');
        var context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        await renderPdf(canvas, pdf);

        canvas.addEventListener('mousedown', async function (e) {
            await renderPdf(canvas, pdf);
            getCursorPosition(canvas, e);
        });
    }

    async function renderPdf(canvas, pdf, pageNumber = 1) {
        const page = await pdf.getPage(pageNumber);

        var container = document.getElementById('canvas-container');
        const containerWidth = container.clientWidth;

        var viewport = page.getViewport({ scale: 1 });

        const scale = containerWidth / viewport.width;
        viewport = page.getViewport({ scale: scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        var renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered');
    }

    function getCursorPosition(canvas, event) {
        const dateInput = document.getElementById("dateInput").value;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        console.log("x: " + x + " y: " + y);

        if (!window.coordinates) {
            window.coordinates = [];
        }
        window.coordinates.push({ x: x, y: y });

        var ctx = canvas.getContext('2d');
        ctx.font = "16px Arial";
        ctx.fillStyle = "blue";

        const stampText1 = "Важный документ";
        const stampText2 = "Входящий от";
        const maxWidth = Math.max(ctx.measureText(stampText1).width, ctx.measureText(stampText2).width, ctx.measureText(dateInput).width);

        ctx.beginPath();
        ctx.rect(x, y, maxWidth + 20, 70);
        ctx.stroke();

        ctx.fillText(stampText1, x + 10, y + 20);
        ctx.fillText(stampText2, x + 10, y + 40);
        ctx.fillText(dateInput, x + 10, y + 60);
    }

    function submitForm(event) {
        event.preventDefault();

        var dateInput = document.getElementById('dateInput');
        var numberInput = document.getElementById('numberInput');

        var fileInput = document.getElementById('fileInput');
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onloadend = function () {
            var data = {
                date: dateInput.value,
                number: numberInput.value,
                coordinates: window.coordinates,
                file: reader.result.split(',')[1],
                fileType: file.type,
                fileName: file.name
            };
            var jsonData = JSON.stringify(data);
            console.log(jsonData);
        };

        reader.readAsDataURL(file);
    }

    var form = document.getElementById('form');
    form.addEventListener('submit', submitForm);
});