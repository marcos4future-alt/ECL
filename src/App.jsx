import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileText, Image, Loader2, FileCode } from 'lucide-react';

export default function DocumentAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [complianceFiles, setComplianceFiles] = useState([]);
  const [extractedImages, setExtractedImages] = useState([]);
  const [complianceImages, setComplianceImages] = useState([]);
  const [excelSheetData, setExcelSheetData] = useState(null);
  const [status, setStatus] = useState('Ready');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [claudeResponse, setClaudeResponse] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [htmlData, setHtmlData] = useState(null);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const fileInputRef = useRef(null);
  const complianceInputRef = useRef(null);

  useEffect(() => {
    const loadLibraries = () => {
      const scripts = [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', varName: 'pdfjsLib' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', varName: 'JSZip' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', varName: 'XLSX' }
      ];

      let loadedCount = 0;

      scripts.forEach(({ src, varName }) => {
        if (window[varName]) {
          loadedCount++;
          if (loadedCount === scripts.length) {
            setLibrariesLoaded(true);
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) {
            setLibrariesLoaded(true);
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          }
        };
        script.onerror = () => {
          setError('Failed to load library: ' + varName);
        };
        document.head.appendChild(script);
      });
    };

    loadLibraries();
  }, []);

  const isValidDocumentType = (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return validTypes.includes(file.type);
  };

  const isExcelFile = (file) => {
    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
           file.type === 'application/vnd.ms-excel';
  };

  const isComplianceDocumentType = (file) => {
    const validTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'text/csv',
      'text/plain',
      'text/tsx',
      'application/typescript'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.tsx');
  };

  const readExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const XLSX = window.XLSX;
          if (!XLSX) {
            reject(new Error('XLSX library not loaded'));
            return;
          }

          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetsData = {};
          workbook.SheetNames.forEach((sheetName, index) => {
            const isLastSheet = index === workbook.SheetNames.length - 1;
            const isPhotoSheet = sheetName.toLowerCase().includes('photo') ||
                                 sheetName.toLowerCase().includes('image') ||
                                 sheetName.toLowerCase().includes('inspection photo');

            if (isLastSheet && isPhotoSheet) {
              return;
            }

            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            sheetsData[sheetName] = jsonData;
          });

          resolve(sheetsData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && isValidDocumentType(file)) {
      setSelectedFile(file);
      setExtractedImages([]);
      setComplianceImages([]);
      setClaudeResponse('');
      setError('');
      setExcelData(null);
      setHtmlData(null);
      setExcelSheetData(null);

      if (isExcelFile(file)) {
        try {
          setStatus('Reading Excel file...');
          const sheetsData = await readExcelFile(file);
          setExcelSheetData(sheetsData);
          setStatus('✓ Excel file loaded with ' + Object.keys(sheetsData).length + ' sheet(s)');
        } catch (err) {
          setError('Error reading Excel file: ' + err.message);
          setStatus('Ready');
        }
      } else {
        setStatus('Ready');
      }
    } else {
      setError('Please select a valid document file (PDF, Word, or Excel)');
    }
  };

  const handleComplianceFiles = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => isComplianceDocumentType(file));

    if (validFiles.length !== files.length) {
      setError('Compliance files must be PDF, XML, CSV, TSX, or text files');
      return;
    }

    setComplianceFiles(prevFiles => [...prevFiles, ...validFiles]);
    setComplianceImages([]);
    setError('');
  };

  const removeComplianceFile = (index) => {
    setComplianceFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setComplianceImages([]);
  };

  const blobToDataUrl = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const extractImagesFromPDF = async (pdfFile, filePrefix, skipCover) => {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const images = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (skipCover && pageNum === 1) {
        continue;
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageHeight = viewport.height;
      const ops = await page.getOperatorList();
      const imageData = [];

      let currentTransform = [1, 0, 0, 1, 0, 0];
      const transformStack = [];

      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];

        if (fn === pdfjsLib.OPS.save) {
          transformStack.push([...currentTransform]);
        } else if (fn === pdfjsLib.OPS.restore) {
          if (transformStack.length > 0) {
            currentTransform = transformStack.pop();
          }
        } else if (fn === pdfjsLib.OPS.transform) {
          const m = ops.argsArray[i];
          currentTransform = [
            currentTransform[0] * m[0] + currentTransform[2] * m[1],
            currentTransform[1] * m[0] + currentTransform[3] * m[1],
            currentTransform[0] * m[2] + currentTransform[2] * m[3],
            currentTransform[1] * m[2] + currentTransform[3] * m[3],
            currentTransform[0] * m[4] + currentTransform[2] * m[5] + currentTransform[4],
            currentTransform[1] * m[4] + currentTransform[3] * m[5] + currentTransform[5]
          ];
        } else if (fn === pdfjsLib.OPS.paintImageXObject ||
                   fn === pdfjsLib.OPS.paintInlineImageXObject ||
                   fn === pdfjsLib.OPS.paintImageMaskXObject) {
          if (ops.argsArray[i] && ops.argsArray[i][0]) {
            const imgName = ops.argsArray[i][0];
            const yPos = currentTransform[5];
            imageData.push({ name: imgName, yPos: yPos });
          }
        }
      }

      const headerThreshold = pageHeight * 0.88;
      const footerThreshold = pageHeight * 0.12;

      const imageNames = new Set();
      imageData.forEach(({ name, yPos }) => {
        if (yPos < headerThreshold && yPos > footerThreshold) {
          imageNames.add(name);
        }
      });

      let imgIdx = 0;
      for (const imgName of imageNames) {
        try {
          let img = null;

          if (page.objs.has(imgName)) {
            img = await new Promise((resolve) => {
              page.objs.get(imgName, resolve);
            });
          } else if (page.commonObjs && page.commonObjs.has(imgName)) {
            img = await new Promise((resolve) => {
              page.commonObjs.get(imgName, resolve);
            });
          }

          if (img && img.width && img.height && img.width > 10 && img.height > 10) {
            imgIdx++;
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (img.data) {
              const imgData = ctx.createImageData(img.width, img.height);
              if (img.kind === 1) {
                for (let k = 0, j = 0; k < img.data.length; k++, j += 4) {
                  imgData.data[j] = imgData.data[j + 1] = imgData.data[j + 2] = img.data[k];
                  imgData.data[j + 3] = 255;
                }
              } else {
                imgData.data.set(img.data);
              }
              ctx.putImageData(imgData, 0, 0);
            } else if (img.bitmap) {
              ctx.drawImage(img.bitmap, 0, 0);
            }

            const blob = await new Promise((resolve) => {
              canvas.toBlob(resolve, 'image/png');
            });

            if (blob && blob.size > 100) {
              const fileName = filePrefix + '_page' + String(pageNum).padStart(3, '0') + '_image' + String(imgIdx).padStart(2, '0') + '.png';
              const dataUrl = await blobToDataUrl(blob);
              images.push({ fileName: fileName, blob: blob, dataUrl: dataUrl });
            }
          }
        } catch (err) {
          console.warn('Failed to extract image ' + imgName + ':', err);
        }
      }
    }

    return images;
  };

  const extractImages = async () => {
    if (!selectedFile) {
      setError('Please select a document file');
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Image extraction only works with PDF files.');
      return;
    }

    if (!librariesLoaded) {
      setError('Libraries still loading, please wait...');
      return;
    }

    setError('');
    setStatus('Extracting images from main PDF...');
    setProgress(0);

    try {
      const images = await extractImagesFromPDF(selectedFile, 'main', true);

      if (images.length === 0) {
        setError('No images found in main PDF');
        setStatus('No images found');
        return;
      }

      setExtractedImages(images);
      setProgress(100);
      setStatus('✓ Extracted ' + images.length + ' images from main PDF');
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Error: ' + err.message);
      setStatus('Error');
    }
  };

  const extractComplianceImages = async () => {
    if (complianceFiles.length === 0) {
      setError('Please add compliance documents first');
      return;
    }

    const pdfFiles = complianceFiles.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      setError('No PDF files found in compliance documents. Image extraction only works with PDFs.');
      return;
    }

    if (!librariesLoaded) {
      setError('Libraries still loading, please wait...');
      return;
    }

    setError('');
    setStatus('Extracting images from compliance PDF documents...');
    setProgress(0);

    try {
      const allImages = [];

      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const filePrefix = 'compliance' + (i + 1);
        setStatus('Processing ' + file.name + ' (' + (i + 1) + '/' + pdfFiles.length + ')...');
        setProgress(Math.round((i / pdfFiles.length) * 100));

        const images = await extractImagesFromPDF(file, filePrefix, false);
        allImages.push(...images);
      }

      if (allImages.length === 0) {
        setError('No images found in compliance PDF documents');
        setStatus('No images found');
        return;
      }

      setComplianceImages(allImages);
      setProgress(100);
      setStatus('✓ Extracted ' + allImages.length + ' images from ' + pdfFiles.length + ' compliance PDF(s)');
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Error: ' + err.message);
      setStatus('Error');
    }
  };

  const resizeImageForAPI = async (dataUrl, maxSize) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxSize && height <= maxSize) {
          resolve(dataUrl);
          return;
        }

        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => {
        console.error('Image resize failed:', err);
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  };

  const downloadZip = async (images, zipName) => {
    if (images.length === 0) {
      setError('No images to download');
      return;
    }

    try {
      const JSZip = window.JSZip;
      if (!JSZip) {
        throw new Error('JSZip library not loaded');
      }

      const zip = new JSZip();
      const folder = zip.folder('images');

      images.forEach(img => {
        folder.file(img.fileName, img.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setStatus('✓ Downloaded ZIP file');
    } catch (err) {
      setError('Error creating ZIP: ' + err.message);
    }
  };

  const executePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!selectedFile) {
      setError('Please select a main document first');
      return;
    }

    setError('');
    setLoading(true);
    setStatus('Preparing files...');

    try {
      const content = [];

      if (selectedFile.type === 'application/pdf') {
        const mainFileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: mainFileBase64
          }
        });
      }

      setStatus('Processing compliance documents...');

      const compliancePDFs = complianceFiles.filter(file => file.type === 'application/pdf');
      const complianceTextFiles = complianceFiles.filter(file => file.type !== 'application/pdf');

      const complianceBase64Files = await Promise.all(
        compliancePDFs.map(file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: file.name,
              data: reader.result.split(',')[1],
              type: 'pdf'
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        )
      );

      const complianceTextContents = await Promise.all(
        complianceTextFiles.map(file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: file.name,
              content: reader.result,
              type: file.type
            });
            reader.onerror = reject;
            reader.readAsText(file);
          })
        )
      );

      complianceBase64Files.forEach(file => {
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data
          }
        });
      });

      const allImages = [...extractedImages, ...complianceImages];

      if (allImages.length > 0) {
        setStatus('Resizing images for API...');

        const resizedImages = await Promise.all(
          allImages.map(async (img, idx) => {
            try {
              const resizedDataUrl = await resizeImageForAPI(img.dataUrl, 2000);
              console.log('Image ' + (idx + 1) + '/' + allImages.length + ' processed: ' + img.fileName);
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: resizedDataUrl.split(',')[1]
                }
              };
            } catch (err) {
              console.error('Failed to process image ' + img.fileName + ':', err);
              return null;
            }
          })
        );

        const validImages = resizedImages.filter(img => img !== null);
        console.log('Sending ' + validImages.length + ' images to Claude');
        content.push(...validImages);
      }

      setStatus('Sending to Claude...');

      let docDescription = '';
      if (selectedFile.type === 'application/pdf') {
        docDescription = '1. Main Document: ' + selectedFile.name + ' (PDF)\n';
      } else if (isExcelFile(selectedFile)) {
        const ext = selectedFile.name.split('.').pop().toUpperCase();
        docDescription = '1. Main Document: ' + selectedFile.name + ' (' + ext + ' file with ' + Object.keys(excelSheetData).length + ' sheet(s))\n';

        docDescription += '\nExcel Sheet Data:\n';
        Object.keys(excelSheetData).forEach((sheetName, idx) => {
          const sheetData = excelSheetData[sheetName];
          docDescription += '  Sheet ' + (idx + 1) + ': "' + sheetName + '" (' + sheetData.length + ' rows)\n';

          if (sheetData.length > 0) {
            docDescription += '    Headers: ' + JSON.stringify(sheetData[0]) + '\n';
            if (sheetData.length > 1) {
              docDescription += '    Sample Row: ' + JSON.stringify(sheetData[1]) + '\n';
            }
          }
        });
        docDescription += '\nFull Excel data has been provided above for analysis.\n';
      } else {
        const ext = selectedFile.name.split('.').pop().toUpperCase();
        docDescription = '1. Main Document: ' + selectedFile.name + ' (' + ext + ' - note: non-PDF documents analyzed via text extraction)\n';
      }

      if (complianceBase64Files.length > 0 || complianceTextContents.length > 0) {
        const totalCompliance = complianceBase64Files.length + complianceTextContents.length;
        docDescription += '2-' + (totalCompliance + 1) + '. Compliance Reference Documents:\n';
        if (complianceBase64Files.length > 0) {
          docDescription += '   PDFs: ' + complianceBase64Files.map(f => f.name).join(', ') + '\n';
        }
        if (complianceTextContents.length > 0) {
          docDescription += '   Text/XML/CSV/TSX files: ' + complianceTextContents.map(f => f.name).join(', ') + '\n';
        }
      }

      if (allImages.length > 0) {
        docDescription += '\nExtracted Images (' + allImages.length + ' total):\n';
        if (extractedImages.length > 0) {
          docDescription += '- ' + extractedImages.length + ' from main PDF: ' + extractedImages.map(i => i.fileName).join(', ') + '\n';
        }
        if (complianceImages.length > 0) {
          docDescription += '- ' + complianceImages.length + ' from compliance PDFs: ' + complianceImages.map(i => i.fileName).join(', ') + '\n';
        }
      }

      const complianceNote = (complianceBase64Files.length > 0 || complianceTextContents.length > 0) ? 'IMPORTANT: Ensure the checklist complies with ALL provided compliance reference documents. Cross-reference requirements from all compliance documents.\n\n' : '';

      let excelDataText = '';
      if (excelSheetData) {
        excelDataText = '\n\nEXCEL FILE CONTENTS:\n';
        excelDataText += '(Note: Last sheet ignored if related to Inspection Photos)\n';
        Object.keys(excelSheetData).forEach(sheetName => {
          excelDataText += '\n=== SHEET: "' + sheetName + '" ===\n';
          const sheetData = excelSheetData[sheetName];
          excelDataText += 'Rows: ' + sheetData.length + '\n';
          excelDataText += 'Data:\n';
          sheetData.slice(0, 100).forEach((row, idx) => {
            excelDataText += 'Row ' + idx + ': ' + JSON.stringify(row) + '\n';
          });
          if (sheetData.length > 100) {
            excelDataText += '... (' + (sheetData.length - 100) + ' more rows)\n';
          }
        });
        excelDataText += '\n';
      }

      let complianceTextData = '';
      if (complianceTextContents.length > 0) {
        complianceTextData = '\n\nCOMPLIANCE DOCUMENTS CONTENT:\n';
        complianceTextContents.forEach(file => {
          complianceTextData += '\n=== FILE: "' + file.name + '" (' + file.type + ') ===\n';
          complianceTextData += file.content + '\n';
        });
        complianceTextData += '\n';
      }

      content.push({
        type: 'text',
        text: 'I have uploaded:\n' + docDescription + '\nAll documents' + (allImages.length > 0 ? ' and ' + allImages.length + ' images' : '') + ' have been provided above and are available for your analysis.\n\n' + excelDataText + complianceTextData + complianceNote + 'Task: ' + prompt + '\n\nIMPORTANT: If you generate an Excel file, provide it as CSV format in a code block marked with ```csv. If HTML output, wrap in code blocks marked with ```html.'
      });

      console.log('Sending request to Claude with:', {
        mainDocIncluded: selectedFile.type === 'application/pdf',
        compliancePDFsCount: complianceBase64Files.length,
        complianceTextFilesCount: complianceTextContents.length,
        imageCount: allImages.length,
        totalContentItems: content.length
      });

      const totalCompliance = complianceBase64Files.length + complianceTextContents.length;
      const pdfCount = (selectedFile.type === 'application/pdf' ? 1 : 0) + complianceBase64Files.length;
      const imageText = allImages.length > 0 ? ' + ' + allImages.length + ' images' : '';
      const complianceText = totalCompliance > 0 ? ' + ' + totalCompliance + ' compliance docs' : '';
      setStatus('Sending to Claude (' + pdfCount + ' PDFs' + complianceText + imageText + ')...');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': window.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: content }]
        })
      });

      if (!response.ok) {
        let errorMessage = 'API request failed';
        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = 'API request failed with status ' + response.status;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      const resultText = data.content[0].text;

      setClaudeResponse(resultText);

      const csvMatch = resultText.match(/```csv\n([\s\S]*?)\n```/);
      if (csvMatch) {
        setExcelData(csvMatch[1]);
      }

      const htmlMatch = resultText.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        setHtmlData(htmlMatch[1]);
      }

      setStatus('✓ Complete');
    } catch (err) {
      setError('Error: ' + err.message);
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (!excelData) return;

    try {
      const XLSX = window.XLSX;
      if (!XLSX) {
        throw new Error('XLSX library not loaded');
      }

      const rows = excelData.split('\n').map(row => {
        const cells = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current);
        return cells;
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Checklist');
      XLSX.writeFile(wb, 'checklist.xlsx');
      setStatus('✓ Downloaded Excel file');
    } catch (err) {
      setError('Error creating Excel: ' + err.message);
    }
  };

  const downloadHtml = () => {
    if (!htmlData) return;

    try {
      const blob = new Blob([htmlData], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setStatus('✓ Downloaded HTML file');
    } catch (err) {
      setError('Error downloading HTML: ' + err.message);
    }
  };

  const downloadCompleteZip = async () => {
    if (!excelData) {
      setError('Excel checklist required');
      return;
    }

    try {
      const XLSX = window.XLSX;
      const JSZip = window.JSZip;

      if (!XLSX || !JSZip) {
        throw new Error('Required libraries not loaded');
      }

      const rows = excelData.split('\n').map(row => {
        const cells = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current);
        return cells;
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Checklist');
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const zip = new JSZip();
      zip.file('checklist.xlsx', excelBuffer);

      const imagesFolder = zip.folder('images');

      const allImages = [...extractedImages, ...complianceImages];
      if (allImages.length > 0) {
        allImages.forEach(img => {
          imagesFolder.file(img.fileName, img.blob);
        });
      } else {
        imagesFolder.file('.placeholder', 'This folder is for images referenced in the checklist.');
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'complete_package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setStatus('✓ Downloaded complete package');
    } catch (err) {
      setError('Error creating complete package: ' + err.message);
    }
  };

  const quickPrompt = () => {
    const complianceNote = complianceFiles.length > 0 ? 'IMPORTANT: You have compliance reference documents attached. Review ALL compliance documents and cross-reference their requirements when creating the checklist.\n\n' : '';

    setPrompt(complianceNote + 'Extrapolate an excel checklist to ensure compliance with the attached procedure and attached reference documents, use the any reference no. as order of tasks and add any references and acceptance criteria into task.\n\nWhen extracting images ignore the cover page, headers and footers, do not extract company logos.\n\nFirst Row to be checklist name, with the second row the column titles, use Category as 1st column (find something common to use as group category), 2nd column is the Task, 3rd column is Type, to include Custom, Date, Range, Recorded, Images. 4th Column to be the Value for 3rd column based on the text in the task, there must be at least 2 values using "/" as divider (do not include units in range and these must be numerical) (Convert all N/A to NA), 5th Column to be Impact, ranging from -2 (highest criticality),-1 (second highest), or 1 (lowest criticality) and -3 (stop the job) (displayed as 1/-3, 1/-2, 1/-1, 1/1) there must be an impact for each answer, no text, just the number and divider. NOTE: When Type is Custom and Value has multiple values with "/" dividers, the Impact MUST have the same number of values with "/" divider. 6th column being the Default, leave column blank. 7th column (column G) is named Images and the image filename from images folder MUST be placed in this 7th column, NOTE this is a new task for the images and must be related to the above task, using the same 1st column category description, do not import logos, it must include the image description, using Image for 3rd column with no information in 4th, 5th and 6th column, with the image filename in 7th column, the 8th column (column H) is Documents and MUST remain empty, 9th column (column I) is the Callout (DO NOT MOVE the Callout to a different column for Image tasks, it must ALWAYS be in column 9), this will be references to the risk assessment, Warning, Caution, Note, Reference, Personnel, Compliance. Use "Reference" when the task has a reference found in the Compliance Document. Use "Compliance" when the task is NEW and was added as an additional task (not found in the Original Source Document). If a task has multiple callouts, use "/" as divider. If a task has 2 callouts of the same type with 2 different callout texts, list both callout types and both texts using "/" as divider (note where image task is added, ensure the callout is in the 9th column and callout text is in the 10th column). 10th Column is the Callout Text with the relevant text relating to column 9. If a task has multiple callout texts, use "/" as divider. Where tasks have been added from the Compliance document add these details to the Reference Callout Text.\n\n⚠️ CRITICAL - DO NOT USE RANGE UNLESS SPECIFIED IN THE TASK\n- Do NOT add Range type without references where the measurements are referenced from\n- Range should ONLY be used when the source document explicitly provides numerical measurements with references\n- When in doubt, use Custom type instead of Range\n\nIf inspection photos/images are requested from the original tasks, give details in the Task, use Custom as Type and Value is Yes/No/NA.\n\nAlways keep the Documents column empty.\n\n⚠️ CRITICAL - CALLOUT SPACING FOR IMAGE TASKS\n- When adding Image tasks, the Callout must ALWAYS be in column 9 (column I)\n- Callout Text must ALWAYS be in column 10 (column J)\n- Do NOT move callouts to different columns for image rows\n\n=== DOCUMENTATION CATEGORY TASKS ===\nUse these EXACT 11 tasks for Documentation category (EXACTLY as shown):\n\nDocumentation,Complete findings section with detailed observations,Custom,Complete/Incomplete,1/-2,,,,Personnel,Record all inspection findings with detailed descriptions\nDocumentation,Provide recommendations based on inspection results,Custom,Complete/Incomplete,1/-2,,,,Personnel,Include maintenance and repair recommendations\nDocumentation,Add job comments and observations,Custom,Complete/Incomplete,1/-1,,,,Personnel,Document additional observations and comments\nDocumentation,Inspector name and signature,Custom,Complete/Incomplete,1/-3,,,,Personnel,Inspector identification and certification required\nDocumentation,Reviewer name and signature,Custom,Complete/Incomplete,1/-3,,,,Personnel,Independent review and approval required\nDocumentation,Record Inspection date,Date,Date,,,,,Personnel,Periodic Inspection/Ad-Hoc Inspection/ Mechanical Integrity/ Ultrasonic Thickness Measurement (UTM)/ Close\nDocumentation,Inspection type,Custom,Visual Inspection (CVI),1/1/1/1/1,,,,,\nDocumentation,Contractor,Recorded,Name,,,,,,\nDocumentation,Contract (PO No),Recorded,Number,,,,,,\nDocumentation,Activity Description,Custom,Internal/ External,1/1,,,,,\nDocumentation,Vessel Name,Recorded,Name,,,,,,\n\nDo not create a Readme file.\nDownload Zip file with Excel checklist and images folder containing all extracted images.\n\nOutput as CSV format with EXACTLY 9 commas per row (10 columns).');
  };

  const allImages = [...extractedImages, ...complianceImages];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText size={32} />
            Avantis ECL powered by iDC
          </h1>
          <p className="mt-2 text-blue-100">Extract images from PDFs, analyze Excel multi-tab files, and process all document types with AI</p>
        </div>

        <div className="p-6 space-y-6">
          {!librariesLoaded && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading required libraries...
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Main Document (PDF, Word, or Excel with Multiple Tabs)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Excel files: All sheets/tabs will be automatically extracted and analyzed
            </p>
            {selectedFile && (
              <div className="mt-2">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  ✓ {selectedFile.name}
                </p>
                {selectedFile.type !== 'application/pdf' && !isExcelFile(selectedFile) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Note: Image extraction only works with PDF files. Word files will be analyzed directly.
                  </p>
                )}
                {isExcelFile(selectedFile) && excelSheetData && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Loaded {Object.keys(excelSheetData).length} sheet(s): {Object.keys(excelSheetData).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Compliance Reference Documents (PDF, XML, CSV, TSX, Text)
              </label>
              <button
                onClick={() => complianceInputRef.current?.click()}
                className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium"
              >
                + Add Document{complianceFiles.length > 0 ? 's' : ''}
              </button>
            </div>
            <input
              ref={complianceInputRef}
              type="file"
              accept=".pdf,.xml,.csv,.tsx,.txt,application/pdf,application/xml,text/xml,text/csv,text/plain,text/tsx,application/typescript"
              multiple
              onChange={handleComplianceFiles}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mb-2">
              You can select multiple files at once (Ctrl/Cmd+Click) or add them one at a time. Accepts PDF, XML, CSV, TSX, and text files. Image extraction only works for PDFs.
            </p>
            {complianceFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-800 mb-2">
                    {complianceFiles.length} Compliance Document{complianceFiles.length > 1 ? 's' : ''} Loaded
                  </p>
                  <div className="space-y-2">
                    {complianceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-purple-100">
                        <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                        <button
                          onClick={() => removeComplianceFile(index)}
                          className="ml-2 text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center bg-purple-50">
                <p className="text-sm text-gray-600">No compliance documents added yet</p>
                <p className="text-xs text-gray-500 mt-1">Click "Add Documents" to select reference files</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{status}</span>
              <span className="text-sm font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: progress + '%' }}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {selectedFile && selectedFile.type === 'application/pdf' && (
              <button
                onClick={extractImages}
                disabled={loading || !librariesLoaded}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Image size={20} />
                Extract Images from Main PDF
              </button>
            )}

            {complianceFiles.length > 0 && complianceFiles.some(f => f.type === 'application/pdf') && (
              <button
                onClick={extractComplianceImages}
                disabled={loading || !librariesLoaded}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Image size={20} />
                Extract Images from Compliance PDFs
              </button>
            )}

            {extractedImages.length > 0 && (
              <button
                onClick={() => downloadZip(extractedImages, 'main_images.zip')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Download size={20} />
                Download Main Images ({extractedImages.length})
              </button>
            )}

            {complianceImages.length > 0 && (
              <button
                onClick={() => downloadZip(complianceImages, 'compliance_images.zip')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Download size={20} />
                Download Compliance Images ({complianceImages.length})
              </button>
            )}
          </div>

          {selectedFile && (
            <div className="border-t pt-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Analysis powered by iDC</h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Ready for analysis:</strong>
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Main Document: {selectedFile.name}</li>
                  {excelSheetData && (
                    <li>• Excel file with {Object.keys(excelSheetData).length} sheet(s): {Object.keys(excelSheetData).join(', ')}</li>
                  )}
                  {complianceFiles.length > 0 && (
                    <li>• {complianceFiles.length} compliance document{complianceFiles.length > 1 ? 's' : ''} ({complianceFiles.filter(f => f.type === 'application/pdf').length} PDF, {complianceFiles.filter(f => f.type !== 'application/pdf').length} text/XML/CSV/TSX)</li>
                  )}
                  {extractedImages.length > 0 && (
                    <li>• {extractedImages.length} images from main PDF</li>
                  )}
                  {complianceImages.length > 0 && (
                    <li>• {complianceImages.length} images from compliance PDFs</li>
                  )}
                </ul>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Prompt
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={quickPrompt}
                      className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Avantis Group
                    </button>
                    <button
                      onClick={() => {
                        const complianceNote = complianceFiles.length > 0 ? 'IMPORTANT: You have compliance reference documents attached. Review ALL compliance documents and cross-reference their requirements when creating the checklist.\n\n' : '';
                        setPrompt(complianceNote + 'Extrapolate an excel checklist to ensure compliance with the attached procedure and attached reference documents, use the any reference no. as order of tasks and add any references and acceptance criteria into task.\n\nWhen extracting images ignore the cover page, headers and footers, do not extract company logos.\n\nFirst Row to be checklist name, with the second row the column titles, use Category as 1st column (find something common to use as group category), 2nd column is the Task, 3rd column is Type, to include Custom, Date, Range, Recorded, Images. 4th Column to be the Value for 3rd column based on the text in the task, there must be at least 2 values using "/" as divider (do not include units in range and these must be numerical) (Convert all N/A to NA), 5th Column to be Impact, ranging from -2 (highest criticality),-1 (second highest), or 1 (lowest criticality) and -3 (stop the job) (displayed as 1/-3, 1/-2, 1/-1, 1/1) there must be an impact for each answer, no text, just the number and divider. NOTE: When Type is Custom and Value has multiple values with "/" dividers, the Impact MUST have the same number of values with "/" divider. 6th column being the Default, leave column blank. 7th column (column G) is named Images and the image filename from images folder MUST be placed in this 7th column, NOTE this is a new task for the images and must be related to the above task, using the same 1st column category description, do not import logos, it must include the image description, using Image for 3rd column with no information in 4th, 5th and 6th column, with the image filename in 7th column, the 8th column (column H) is Documents and MUST remain empty, 9th column (column I) is the Callout (DO NOT MOVE the Callout to a different column for Image tasks, it must ALWAYS be in column 9), this will be references to the risk assessment, Warning, Caution, Note, Reference, Personnel, Compliance. Use "Reference" when the task has a reference found in the Compliance Document. Use "Compliance" when the task is NEW and was added as an additional task (not found in the Original Source Document). If a task has multiple callouts, use "/" as divider. If a task has 2 callouts of the same type with 2 different callout texts, list both callout types and both texts using "/" as divider (note where image task is added, ensure the callout is in the 9th column and callout text is in the 10th column). 10th Column is the Callout Text with the relevant text relating to column 9. If a task has multiple callout texts, use "/" as divider. Where tasks have been added from the Compliance document add these details to the Reference Callout Text.\n\n⚠️ CRITICAL - DO NOT USE RANGE UNLESS SPECIFIED IN THE TASK\n- Do NOT add Range type without references where the measurements are referenced from\n- Range should ONLY be used when the source document explicitly provides numerical measurements with references\n- When in doubt, use Custom type instead of Range\n\nIf inspection photos/images are requested from the original tasks, give details in the Task, use Custom as Type and Value is Yes/No/NA.\n\nAlways keep the Documents column empty.\n\n⚠️ CRITICAL - CALLOUT SPACING FOR IMAGE TASKS\n- When adding Image tasks, the Callout must ALWAYS be in column 9 (column I)\n- Callout Text must ALWAYS be in column 10 (column J)\n- Do NOT move callouts to different columns for image rows\n\nDo not create a Readme file.\nDownload Zip file with Excel checklist and images folder containing all extracted images.\n\nOutput as CSV format with EXACTLY 9 commas per row (10 columns).');
                      }}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Borr Drilling
                    </button>
                  </div>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your analysis prompt here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <button
                onClick={executePrompt}
                disabled={loading || !prompt.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Execute Prompt
                  </>
                )}
              </button>

              {claudeResponse && (
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold text-gray-800 mb-3">Claude Response:</h3>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                      {claudeResponse}
                    </div>
                  </div>

                  {excelData && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Download Package:</strong> The complete package includes the Excel checklist and an 'images' folder. The folder will contain all extracted images ({allImages.length} total){allImages.length === 0 ? ' or a placeholder if no images were extracted' : ''}.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {excelData && (
                      <>
                        <button
                          onClick={downloadCompleteZip}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-bold flex items-center gap-2 shadow-lg"
                        >
                          <Download size={20} />
                          Download Complete Package (Excel + Images Folder)
                        </button>
                        <button
                          onClick={downloadExcel}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                        >
                          <Download size={20} />
                          Download Excel Only
                        </button>
                      </>
                    )}
                    {htmlData && (
                      <button
                        onClick={downloadHtml}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
                      >
                        <FileCode size={20} />
                        Download HTML
                      </button>
                    )}
                    {allImages.length > 0 && (
                      <button
                        onClick={() => downloadZip(allImages, 'all_images.zip')}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                      >
                        <Download size={20} />
                        Download All Images Only ({allImages.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DocumentAnalyzer />);
