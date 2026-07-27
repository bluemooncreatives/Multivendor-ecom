<form class="form-horizontal" action="{{ route('withdraw_request.payment_store') }}" method="POST" enctype="multipart/form-data">
    @csrf
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h4 class="modal-title" id="myModalLabel">{{translate('Affiliate Withdraw Request')}}</h4>
    </div>

    <div class="modal-body">
        <div>
            <table class="table table-responsive">
                <tbody>
                    <tr>
                        <td>{{ translate('Paypal Email') }}</td>
                        <td>{{ $affiliate_user->paypal_email }}</td>
                    </tr>
                    <tr>
                        <td>{{ translate('Bank Information') }}</td>
                        <td>{{ $affiliate_user->bank_information }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <input type="hidden" name="affiliate_user_id" value="{{ $affiliate_user->id }}">
        <input type="hidden" name="affiliate_withdraw_request_id" value="{{ $affiliate_withdraw_request->id }}">
        <div class="form-group">
            <label class="col-sm-3 control-label" for="amount">{{translate('Amount')}}</label>
            <div class="col-sm-9">
                <input type="hidden" name="amount" value="{{$affiliate_withdraw_request->amount}}" class="form-control">
                <input type="number" value="{{$affiliate_withdraw_request->amount}}" class="form-control" disabled>
            </div>
        </div>

        <div class="form-group">
            <label class="col-sm-3 control-label" for="payment_method">{{translate('Payment Method')}}</label>
            <div class="col-sm-9">
                <select name="payment_method" id="payment_method" class="form-control demo-select2-placeholder" required>
                    <option value="">{{translate('Select Payment Method')}}</option>
                    <option value="Paypal">{{translate('Paypal')}}</option>
                    <option value="Bank">{{translate('Bank')}}</option>
                </select>
            </div>
        </div>

    </div>
    <div class="modal-footer">
        <div class="panel-footer text-right">
            <button class="btn btn-purple" type="submit">{{translate('Pay')}}</button>
            <button class="btn btn-default" data-dismiss="modal">{{translate('Cancel')}}</button>
        </div>
    </div>
</form>
