using ELearning.Application.Interfaces;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ELearning.Infrastructure.Services;

public class CertificatePdfService
{
    private readonly AppDbContext _db;

    public CertificatePdfService(AppDbContext db)
    {
        _db = db;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<(byte[] PdfBytes, string FileName)> GenerateAsync(
        Guid certificateId, string verifyBaseUrl, CancellationToken ct = default)
    {
        var cert = await _db.Certificates
            .Include(c => c.Course)
            .Include(c => c.Learner)
            .Include(c => c.IssuedByInstructor)
            .FirstOrDefaultAsync(c => c.Id == certificateId, ct)
            ?? throw new KeyNotFoundException("Certificate not found.");

        var verifyUrl = $"{verifyBaseUrl.TrimEnd('/')}/certificates/verify/{cert.Code}";
        var qrBytes = GenerateQrCode(verifyUrl);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Lato"));

                page.Content()
                    .Border(3).BorderColor(Colors.Blue.Darken2)
                    .Padding(40)
                    .AlignMiddle()
                    .Column(col =>
                    {
                        col.Spacing(8);

                        // Header
                        col.Item().AlignCenter().Text("CERTIFICATE OF COMPLETION")
                            .FontSize(24).Bold().FontColor(Colors.Blue.Darken2);

                        col.Item().PaddingTop(12).AlignCenter()
                            .Text("This is to certify that")
                            .FontSize(10).FontColor(Colors.Grey.Darken1);

                        // Learner name
                        col.Item().AlignCenter()
                            .Text(cert.Learner.FullName)
                            .FontSize(30).Bold().FontColor(Colors.Black);

                        col.Item().AlignCenter()
                            .Text("has successfully completed the course")
                            .FontSize(10).FontColor(Colors.Grey.Darken1);

                        // Course title
                        col.Item().AlignCenter()
                            .Text(cert.Course.Title)
                            .FontSize(18).SemiBold().FontColor(Colors.Blue.Darken3);

                        // Optional message — constrained width so it doesn't reach the edges
                        if (!string.IsNullOrWhiteSpace(cert.Message))
                        {
                            col.Item().PaddingTop(8).AlignCenter()
                                .MaxWidth(600)
                                .Text($"\"{cert.Message}\"")
                                .FontSize(10).Italic().FontColor(Colors.Grey.Darken2);
                        }

                        col.Item().PaddingTop(24);

                        // Footer row — instructor + date on left, QR on right
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(left =>
                            {
                                left.Spacing(3);
                                left.Item().Text("Issued by")
                                    .FontSize(9).FontColor(Colors.Grey.Darken1);
                                left.Item().Text(cert.IssuedByInstructor.FullName)
                                    .FontSize(12).SemiBold();

                                left.Item().PaddingTop(6)
                                    .Text($"Issued: {cert.IssuedAt:MMMM d, yyyy}")
                                    .FontSize(9).FontColor(Colors.Grey.Darken1);

                                left.Item()
                                    .Text($"Certificate ID: {cert.Code}")
                                    .FontSize(9).FontColor(Colors.Grey.Darken1);

                                if (!cert.IsActive)
                                {
                                    left.Item().PaddingTop(4)
                                        .Text($"REVOKED — {cert.RevokedReason}")
                                        .FontSize(9).Bold().FontColor(Colors.Red.Darken2);
                                }
                            });

                            row.ConstantItem(90).Column(right =>
                            {
                                right.Item().Image(qrBytes).FitWidth();
                                right.Item().PaddingTop(2).AlignCenter()
                                    .Text("Scan to verify")
                                    .FontSize(7).FontColor(Colors.Grey.Darken1);
                            });
                        });
                    });
            });
        }).GeneratePdf();

        var fileName = $"certificate-{cert.Code}.pdf";
        return (pdf, fileName);
    }

    private static byte[] GenerateQrCode(string url)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        var qr = new PngByteQRCode(data);
        return qr.GetGraphic(10);
    }
}