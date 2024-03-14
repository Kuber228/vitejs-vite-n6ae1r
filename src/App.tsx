import React, { useState, useEffect } from 'react';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';
import './App.css';
interface CertificateData {
  commonName: string;
  validity: string;
  issuer: string;
  raw: Certificate;
}

const CertificateStore: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedCertificates = JSON.parse(
      localStorage.getItem('certificates') || '[]'
    ) as CertificateData[];
    setCertificates(storedCertificates);
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    parseCertificate(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];
    if (file) {
      parseCertificate(file);
    }
  };

  const parseCertificate = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target!.result as ArrayBuffer;
      try {
        const asn1 = asn1js.fromBER(arrayBuffer);
        const certificate = new Certificate({ schema: asn1.result });
        const commonName = certificate.subject.typesAndValues.find(
          (attr) => attr.type === '2.5.4.3'
        )!.value.valueBlock.value;
        const validity = new Date(
          certificate.notAfter.value
        ).toLocaleDateString();
        const issuer = certificate.issuer.typesAndValues.find(
          (attr) => attr.type === '2.5.4.3'
        )!.value.valueBlock.value;

        const newCertificate: CertificateData = {
          commonName: commonName as string,
          validity: validity,
          issuer: issuer as string,
          raw: certificate,
        };

        setCertificates((prevCertificates) => [
          ...prevCertificates,
          newCertificate,
        ]);
        localStorage.setItem(
          'certificates',
          JSON.stringify([...certificates, newCertificate])
        );

        setSuccessMessage('Certificate added successfully.');
        setError(null);
      } catch (error) {
        setError(
          'Invalid certificate format. Please select a valid certificate file.'
        );
        setSuccessMessage(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDelete = (index: number) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    setCertificates(updatedCertificates);
    localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
  };

  const handleCertificateClick = (certificate: CertificateData) => {
    setSelectedCertificate(certificate);
  };

  const handleCloseDetails = () => {
    setSelectedCertificate(null);
  };

  return (
    <div className="container">
      <div className="left__info">
        <h1>Cховище сертифікатів</h1>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <div className="area-input">
          <input type="file" onChange={handleFileInput} />
          <div
            className="drop-area"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            Перетягніть файл сюди
          </div>
        </div>
        <table className="certificate-table">
          <thead className="info-table">
            <tr>
              <th>Common Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert, index) => (
              <tr key={index}>
                <td className="common-name">
                  <button
                    className="certificate-button"
                    onClick={() => handleCertificateClick(cert)}
                  >
                    {cert.commonName}
                  </button>
                </td>
                <td className="delete-item-name">
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCertificate && (
        <div className="details-container">
          <h2>Details</h2>
          <p>
            <strong>Common Name:</strong> {selectedCertificate.commonName}
          </p>
          <p>
            <strong>Validity:</strong> {selectedCertificate.validity}
          </p>
          <p>
            <strong>Issuer:</strong> {selectedCertificate.issuer}
          </p>
          <button className="close-button" onClick={handleCloseDetails}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificateStore;
